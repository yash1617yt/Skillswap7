import React, { createContext, useState, useEffect } from 'react'

export const ThemeContext = createContext()

const LIGHT_THEMES = [
  { id: 'sunset', name: 'Sunset Glow', emoji: '🌇' },
  { id: 'sky', name: 'Sky Breeze', emoji: '☁️' },
  { id: 'mint', name: 'Mint Fresh', emoji: '🌿' },
  { id: 'lavender', name: 'Lavender Mist', emoji: '💜' },
  { id: 'peach', name: 'Peach Cream', emoji: '🍑' },
  { id: 'aqua', name: 'Aqua Glass', emoji: '🫧' },
  { id: 'sand', name: 'Sandy Light', emoji: '🏖️' },
  { id: 'blush', name: 'Blush Rose', emoji: '🌸' },
  { id: 'slate', name: 'Slate Calm', emoji: '🩶' },
  { id: 'lime', name: 'Lime Pop', emoji: '🍋' },
]

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : false
  })
  const [lightTheme, setLightThemeState] = useState(() => {
    const saved = localStorage.getItem('lightTheme')
    const exists = LIGHT_THEMES.some((theme) => theme.id === saved)
    return exists ? saved : 'sunset'
  })

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    localStorage.setItem('lightTheme', lightTheme)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    document.documentElement.setAttribute('data-light-theme', lightTheme)
  }, [isDark, lightTheme])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const setLightTheme = (themeId) => {
    if (LIGHT_THEMES.some((theme) => theme.id === themeId)) {
      setLightThemeState(themeId)
    }
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, lightTheme, setLightTheme, lightThemes: LIGHT_THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}
