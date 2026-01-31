import api from "../axios"

export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

export const register = (email_: string, password_: string, full_name_: string | undefined) =>
  api.post("/auth/register",{
    email: email_,  
    password: password_,
    full_name: full_name_ || undefined
    }
  );

export const getMe = async () => {
  const token = localStorage.getItem("token")
  const res = await api.get("auth/me", 
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    })
  return res.data
}
 
   