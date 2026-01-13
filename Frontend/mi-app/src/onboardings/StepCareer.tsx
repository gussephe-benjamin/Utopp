import type { OnboardingData } from "./OnboardingData";

type Props = {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
};

export default function StepCareer({ data, setData }: Props) {
  return (
    <div>
      <h3>¿Cuál es tu carrera?</h3>

      <input
        type="text"
        value={data.career}
        onChange={(e) =>
          setData({ ...data, career: e.target.value })
        }
        placeholder="Ej: Ingeniería de Sistemas"
      />
    </div>
  );
}
