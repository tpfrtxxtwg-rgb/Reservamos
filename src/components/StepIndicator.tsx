import { motion, AnimatePresence } from 'framer-motion';
import {
  AirplaneLanding,
  MapPin,
  Car,
  ShoppingCart,
  CreditCard,
  ArrowsLeftRight,
  Check,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  palette: {
    primary: string;
    primary15: string;
    primary50: string;
  };
  labels: string[];
}

const stepIcons: ReactNode[] = [
  <AirplaneLanding size={14} weight="bold" />,
  <MapPin size={14} weight="bold" />,
  <ArrowsLeftRight size={14} weight="bold" />,
  <Car size={14} weight="bold" />,
  <ShoppingCart size={14} weight="bold" />,
  <CreditCard size={14} weight="bold" />,
];

export default function StepIndicator({
  currentStep,
  totalSteps,
  palette,
  labels,
}: StepIndicatorProps) {
  const getStepState = (index: number): 'completed' | 'current' | 'upcoming' => {
    const stepNum = index + 1;
    if (stepNum < currentStep) return 'completed';
    if (stepNum === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full">
      {/* Step counter - visible on mobile */}
      <p className="mb-3 text-center text-[11px] font-medium text-[#8A8278] sm:hidden">
        Step {currentStep} of {totalSteps}
      </p>

      <div className="flex w-full items-center">
        {Array.from({ length: totalSteps }, (_, index) => {
          const state = getStepState(index);
          const isLast = index === totalSteps - 1;
          const label = labels[index] || '';

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5">
                {/* Circle */}
                <motion.div
                  className="relative flex items-center justify-center rounded-full"
                  initial={false}
                  animate={{
                    width: state === 'current' ? 38 : 32,
                    height: state === 'current' ? 38 : 32,
                    backgroundColor:
                      state === 'upcoming' ? 'transparent' : palette.primary,
                    borderColor:
                      state === 'upcoming'
                        ? 'rgba(138, 130, 120, 0.25)'
                        : palette.primary,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{
                    borderWidth: state === 'upcoming' ? 2 : 0,
                    borderStyle: 'solid',
                  }}
                >
                  {/* Pulse ring for current step */}
                  {state === 'current' && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: `2px solid ${palette.primary}` }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {/* Icon */}
                  <AnimatePresence mode="wait">
                    {state === 'completed' ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        <Check size={14} weight="bold" className="text-white" />
                      </motion.div>
                    ) : (
                      <span
                        className={state === 'current' ? 'text-white' : 'text-[#8A8278]'}
                      >
                        {stepIcons[index] || stepIcons[stepIcons.length - 1]}
                      </span>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Label - hidden on mobile */}
                <span
                  className={`hidden sm:block font-body text-[10px] whitespace-nowrap ${
                    state === 'upcoming' ? 'text-[#8A8278]' : 'text-charcoal font-medium'
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {!isLast && (
                <div className="flex-1 h-0.5 mx-1 sm:mx-2 relative overflow-hidden rounded-full">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: palette.primary15 }}
                  />
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: palette.primary }}
                    initial={false}
                    animate={{
                      width: index < currentStep - 1 ? '100%' : '0%',
                    }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
