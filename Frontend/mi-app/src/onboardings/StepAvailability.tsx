import type { OnboardingData } from "./OnboardingData";

type Props = {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
};

export default function StepAvailability({ data, setData }: Props) {
  return (
    <div>
      <h3>¿Cuántas horas a la semana?</h3>

      <input
        type="number"
        min={1}
        value={data.availability}
        onChange={(e) =>
          setData({ ...data, availability: Number(e.target.value) })
        }
      />
    </div>
  );
}
