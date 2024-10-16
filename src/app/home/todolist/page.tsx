'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

interface Todo {
  id: string
  text: string
  completed: boolean
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // Récupérer l'utilisateur connecté et écouter les changements en temps réel
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        const todosCollection = collection(db, `users/${user.uid}/todolist`);
        // Écouter les modifications de la base de données en temps réel
        const unsubscribeFirestore = onSnapshot(todosCollection, (snapshot) => {
          const todosData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Todo[];
          setTodos(todosData);
        });

        return () => unsubscribeFirestore(); // Arrêter l'écoute quand le composant est démonté
      }
    });

    return () => unsubscribeAuth(); // Arrêter l'écoute de l'authentification quand le composant est démonté
  }, []);

  const addTodo = async () => {
    if (inputValue.trim() !== '' && userId) {
      const newTodo = { text: inputValue, completed: false };
      await addDoc(collection(db, `users/${userId}/todolist`), newTodo);
      setInputValue('');
    }
  }

  const deleteTodo = async (id: string) => {
    if (userId) {
      await deleteDoc(doc(db, `users/${userId}/todolist`, id));
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    if (userId) {
      await updateDoc(doc(db, `users/${userId}/todolist`, id), { completed: !completed });
    }
  }

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditValue(text);
  }

  const saveEdit = async () => {
    if (editingId && userId) {
      await updateDoc(doc(db, `users/${userId}/todolist`, editingId), { text: editValue });
      setEditingId(null);
      setEditValue('');
    }
  }

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  }

  const renderTodoItem = (todo: Todo) => (
    <li key={todo.id} className="flex items-center space-x-2 bg-gray-100 p-2 rounded mb-2">
      {editingId === todo.id ? (
        <>
          <Input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={saveEdit} size="sm"><Check className="h-4 w-4" /></Button>
          <Button onClick={cancelEdit} size="sm"><X className="h-4 w-4" /></Button>
        </>
      ) : (
        <>
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
            id={`todo-${todo.id}`}
          />
          <label
            htmlFor={`todo-${todo.id}`}
            className={`flex-grow ${todo.completed ? 'line-through text-gray-500' : ''}`}
          >
            {todo.text}
          </label>
          <Button onClick={() => startEditing(todo.id, todo.text)} size="sm"><Edit2 className="h-4 w-4" /></Button>
          <Button onClick={() => deleteTodo(todo.id)} size="sm"><Trash2 className="h-4 w-4" /></Button>
        </>
      )}
    </li>
  )

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">Ma Liste de Tâches</h1>
      
      <div className="mb-6">
        <div className="flex">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ajouter une tâche"
            className="flex-grow mr-2"
          />
          <Button onClick={addTodo}><Plus className="h-4 w-4 mr-2" /> Ajouter</Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="active">Actives</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <ul>{todos.map(renderTodoItem)}</ul>
        </TabsContent>
        
        <TabsContent value="active">
          <ul>{todos.filter(todo => !todo.completed).map(renderTodoItem)}</ul>
        </TabsContent>
        
        <TabsContent value="completed">
          <ul>{todos.filter(todo => todo.completed).map(renderTodoItem)}</ul>
        </TabsContent>
      </Tabs>
    </div>
  )
}
