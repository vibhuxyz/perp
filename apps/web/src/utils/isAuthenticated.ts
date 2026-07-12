import { useEffect, useState } from "react"

export const AuthProvider = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const token = localStorage.getItem("user_token")

    if (token) {
      setIsAuthenticated(true)
    }

    setLoading(false)
  }, [])
}
