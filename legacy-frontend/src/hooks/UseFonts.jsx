import { useEffect } from 'react'

const useFonts = () => {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Anaheim&family=Inter:wght@400;600&family=Playfair+Display:ital@0;1&family=Pacifico&display=swap'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])
}

export default useFonts