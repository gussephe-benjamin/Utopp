import { useState } from "react"

/**
 * Ejecuta `reset` durante el render cuando alguna de las `deps` cambia respecto
 * al render anterior. La comparación es la misma que aplica `useEffect`:
 * `Object.is` posición a posición.
 *
 * Es el patrón que React recomienda para «ajustar estado cuando cambia una
 * prop», en lugar de hacer `setState` dentro de un `useEffect`: el efecto
 * provoca un render en cascada y deja un frame pintado con el estado viejo.
 *
 * @see https://react.dev/learn/you-might-not-need-an-effect
 */
export function useResetOnChange(
  deps: readonly unknown[],
  reset: () => void,
): void {
  const [prevDeps, setPrevDeps] = useState(deps)
  const changed =
    prevDeps.length !== deps.length ||
    prevDeps.some((value, i) => !Object.is(value, deps[i]))

  if (changed) {
    setPrevDeps(deps)
    reset()
  }
}
