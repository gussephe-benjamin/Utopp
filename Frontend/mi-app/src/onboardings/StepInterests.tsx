import type { OnboardingData } from "./OnboardingData";

type Props = {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
};

const options = ["Frontend", "Backend", "Data", "IA"];

export default function StepInterests({ data, setData }: Props) {
  const toggle = (value: string) => {
    const exists = data.interests.includes(value);

    setData({
      ...data,
      interests: exists
        ? data.interests.filter((i) => i !== value)
        : [...data.interests, value],
    });
  };

  return (
    <div>
      <h3>¿Qué te interesa?</h3>

      {options.map((opt) => (
        <label key={opt} style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={data.interests.includes(opt)}
            onChange={() => toggle(opt)}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}
