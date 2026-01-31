import type { OnboardingData } from "../../types/OnboardingData";
import api from "../axios"

export const isComplete = (id: number) =>
  api.post("/onboarding/isComplete", { id });


export const updateOnboarding = async (data: OnboardingData) => {
  try {
    const response = await api.post("/onboarding/update", data);
    // Aquí puedes manejar la respuesta de la API, como verificar el estado de la solicitud
    // y realizar acciones adicionales si es necesario
    console.log(response.data);
    return response.data;
  } catch (error) {
    // Maneja cualquier error que pueda ocurrir durante la solicitud
    console.error(error);
    throw error;
  }
}
