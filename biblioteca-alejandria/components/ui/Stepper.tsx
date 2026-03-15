interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={step.label} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5 relative z-[1]">
              <div
                className={`w-9 h-9 rounded-full grid place-items-center text-sm font-bold border-2 transition-all duration-300
                  ${isDone
                    ? "bg-brand-secondary border-brand-secondary text-brand-bg"
                    : isActive
                      ? "bg-brand-primary border-brand-primary text-brand-bg"
                      : "bg-brand-bg border-brand-accent/30 text-brand-accent"
                  }`}
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {isDone ? "✓" : stepNumber}
              </div>
              <span
                className={`text-[0.65rem] uppercase tracking-widest whitespace-nowrap transition-colors duration-300
                  ${isDone
                    ? "text-brand-secondary"
                    : isActive
                      ? "text-brand-primary font-medium"
                      : "text-brand-accent"
                  }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 mb-5 transition-colors duration-300
                  ${isDone ? "bg-brand-secondary" : "bg-brand-accent/25"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
