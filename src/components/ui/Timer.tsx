"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PauseIcon, PlayIcon, RotateCcw, ChevronLeftIcon, ChevronRightIcon, Settings } from 'lucide-react'

export const Timer: React.FC = () => {
  const [workTime, setWorkTime] = useState(25)
  const [breakTime, setBreakTime] = useState(5)
  const [timeLeft, setTimeLeft] = useState(workTime * 60)
  const [isActive, setIsActive] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [isCounterVisible, setIsCounterVisible] = useState(true)
  const [showConfig, setShowConfig] = useState(true)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
    } else if (isActive && timeLeft === 0) {
      if (isBreak) {
        setTimeLeft(workTime * 60)
        setIsBreak(false)
      } else {
        setTimeLeft(breakTime * 60)
        setIsBreak(true)
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, workTime, breakTime, isBreak])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(workTime * 60)
    setIsBreak(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    if (workTime > 0 && breakTime > 0) {
      setShowConfig(false)
      setTimeLeft(workTime * 60)
    } else {
      alert("Veuillez entrer des valeurs positives pour le temps de travail et de pause.")
    }
  }

  const openConfig = () => {
    setShowConfig(true)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {showConfig ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Configurez votre timer</h2>
          <div>
            <Label htmlFor="workTime">Temps de travail (minutes)</Label>
            <Input
              id="workTime"
              type="number"
              value={workTime}
              onChange={(e) => setWorkTime(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="breakTime">Temps de pause (minutes)</Label>
            <Input
              id="breakTime"
              type="number"
              value={breakTime}
              onChange={(e) => setBreakTime(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
            />
          </div>
          <Button onClick={startTimer}>Démarrer</Button>
        </div>
      ) : (
        <div className={`transition-all duration-300 ease-in-out ${isCounterVisible ? 'w-auto' : 'w-8'}`}>
          <div className="flex items-center space-x-2">
            {isCounterVisible && (
              <>
                <div 
                  className="text-3xl font-bold cursor-pointer" 
                  onClick={openConfig}
                  title="Cliquez pour reconfigurer"
                >
                  {formatTime(timeLeft)}
                </div>
                <div className="flex space-x-1">
                  <Button size="icon" variant="outline" onClick={toggleTimer}>
                    {isActive ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="outline" onClick={resetTimer}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={openConfig}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setIsCounterVisible(!isCounterVisible)}
              className="ml-1"
            >
              {isCounterVisible ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}