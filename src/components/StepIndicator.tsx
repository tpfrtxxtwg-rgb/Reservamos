import { motion, AnimatePresence } from 'framer-motion';
import {
  AirplaneLanding,
  MapPin,
  Car,
  ShoppingCart,
  CreditCard,
  Check,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';

export interface StepIndicatorProps {
  currentStep: number; // 1-5
  palette: {
    primary: string;
    primary15: string;
    primary50: string;
  };
  steps?: Array<{
    label: string;
    icon: ReactNode;
  }>;
}

const defaultSteps: Array<{ label: string; icon: ReactNode }> = [
  { label: 'Route', icon: <AirplaneLanding size={16} weight="bold" /> },
  { label: 'Location', icon: <MapPin size={16} weight="bold" /> },
  { label: 'Vehicle', icon: <Car size={16} weight="bold" /> },
  { label: 'Extras', icon: <ShoppingCart size={16} weight="bold" /> },
  { label: 'Payment', icon: <CreditCard size={16} weight="bold" /> },
];

export default function StepIndicator({
  currentStep,
  palette,
  steps = defaultSteps,
}: StepIndicatorProps) {
  const totalSteps = steps.length;

  const getStepState = (index: number): 'completed' | 'current' | 'upcoming' => {
    const stepNum = index + 1;
    if (stepNum < currentStep) return 'completed';
    if (stepNum === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full">
      {/* Mobile: step counter text */}
      <p className="mb-3 text-center text-[11px] font-medium text-[#8A8278] sm:hidden">
        Step {currentStep} of {totalSteps}
      </p>

      <div className="flex w-full items-center justify-between">
        {steps.map((step, index) => {
          const state = getStepState(index);
          const isLast = index === totalSteps - 1;

          return (
            <div key={index} className="flex flex-1 items-center">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5">
                {/* Circle */}
                <motion.div
                  className="relative flex items-center justify-center rounded-full sm:h-9 sm:w-9 h-7 w-7"
                  initial={false}
                  animate={{
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
                      style={{ backgroundColor: palette.primary }}
                      initial={{ scale: 1, opacity: 0.35 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.6,
                        ease: 'easeOut',
                      }}
                    />
                  )}

                  {/* Icon */}
                  <AnimatePresence mode="wait">
                    {state === 'completed' ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      >
                        <Check
                          size={16}
                          weight="bold"
                          className="text-white sm:size-4 size-3.5"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        style={{
                          color: state === 'current' ? '#FFFFFF' : '#8A8278',
                        }}
                        className="relative z-10"
                      >
                        {step.icon}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Label */}
                <span
                  className={`hidden text-[11px] leading-tight sm:block whitespace-nowrap ${
                    state === 'upcoming' ? 'text-[#8A8278]' : 'text-[#2D2A26] font-medium'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="relative mx-1 sm:mx-2 flex h-0.5 flex-1 items-center">
                  {/* Background line (light) */}
                  <div
                    className="absolute inset-0 h-full rounded-full"
                    style={{ backgroundColor: 'rgba(138, 130, 120, 0.12)' }}
                  />
                  {/* Active line */}
                  <motion.div
                    className="absolute left-0 top-0 h-full rounded-full"
                    initial={false}
                    animate={{
                      width:
                        state === 'completed'
                          ? '100%'
                          : state === 'current'
                            ? '100%'
                            : '0%',
                      backgroundColor:
                        state === 'completed'
                          ? palette.primary
                          : state === 'current'
                            ? palette.primary15
                            : 'transparent',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
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
