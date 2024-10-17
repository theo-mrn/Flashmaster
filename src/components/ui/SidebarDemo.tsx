"use client";
import React, { useState } from "react";
import Link from "next/link";
import { WalletCards, ListCheck, Plus, NotebookPen,Forward, AudioLines, ChartNoAxesColumnIncreasing } from 'lucide-react';
import Image from "next/image";
import AudioPlayer from "./AudioPlayer"; // Import du composant AudioPlayer

export function SidebarDemo() {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // Fonction pour basculer l'ouverture/fermeture du sidepanel
  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  const links = [
    {
      label: "Ajouter",
      href: "/home/create",
      icon: <Plus className="h-6 w-6" />,
    },
    {
      label: "Mes flashcards",
      href: "/home/piles",
      icon: <WalletCards className="h-6 w-6" />,
    },
    {
      label: "Partagées",
      href: "/home/shared",
      icon: <Forward className="h-6 w-6" />,
    },
    {
      label: "Mes Notes",
      href: "/home/document",
      icon: <NotebookPen className="h-6 w-6" />,
    },
    {
      label: "Mes résultats",
      href: "/home/statistics",
      icon: <ChartNoAxesColumnIncreasing className="h-6 w-6" />,
    },
    {
      label: "Todolist",
      href: "/home/todolist",
      icon: <ListCheck className="h-6 w-6" />,
    },
    {
      label: "Audio",
      href: "#",
      icon: <AudioLines className="h-6 w-6" />,
      action: toggleSidePanel,
    },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="
          group w-20 hover:w-64
          transition-all duration-300
          bg-gray-100 dark:bg-neutral-800
          flex flex-col justify-between p-4
          overflow-hidden rounded-2xl
        ">
        <div className="flex flex-col">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <Image
                  src="/logo.jpg"  // Remplace par le chemin de ton image
                  alt="Logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <span className="
                    text-xl font-bold text-black dark:text-white
                    whitespace-nowrap
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                  ">
                  FlashMaster
                </span>
              </div>
            </Link>
          </div>

          {/* Links */}
          <nav className="flex flex-col space-y-4">
            {links.map((link, idx) => (
              <Link 
                href={link.href} 
                key={idx} 
                onClick={link.action ? (e) => { e.preventDefault(); link.action(); } : undefined}
                className="flex items-center space-x-3 p-2 rounded-md text-neutral-700 dark:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="h-6 w-6">{link.icon}</div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Sidepanel pour le AudioPlayer */}
      <div
        className={`fixed right-0 top-0 h-screen w-[500px] bg-white dark:bg-neutral-900 shadow-lg transform transition-transform duration-300 ${
          isSidePanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ zIndex: 9999 }} // Z-index élevé pour passer par-dessus tout
      >
        {/* Bouton pour fermer le sidepanel */}
        <div className="p-4">
          <button
            onClick={toggleSidePanel}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

        {/* Contenu du sidepanel : Composant AudioPlayer */}
        <div className="p-4">
          <AudioPlayer />
        </div>
      </div>
    </div>
  );
}
