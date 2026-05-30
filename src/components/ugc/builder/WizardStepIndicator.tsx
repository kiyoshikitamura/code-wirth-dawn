'use client';

import React from 'react';

interface WizardStepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const STEPS = [
  { num: 1, label: '基本' },
  { num: 2, label: 'フロー' },
  { num: 3, label: '報酬' },
  { num: 4, label: '確認' },
];

function WizardStepIndicatorInner({ currentStep, totalSteps = 4 }: WizardStepIndicatorProps) {
  return (
    <div className="w-full bg-[#1a120e] border-b border-[#5c3c2a] px-4 py-3 shrink-0 flex items-center justify-between">
      <div className="flex items-center gap-1.5 w-full justify-around max-w-md mx-auto">
        {STEPS.map((step, idx) => {
          const isActive = step.num === currentStep;
          const isCompleted = step.num < currentStep;

          return (
            <React.Fragment key={step.num}>
              {/* Step Circle & Label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-amber-400 text-[#0d0907] ring-4 ring-amber-400/20 scale-110 shadow-lg shadow-amber-500/10'
                      : isCompleted
                      ? 'bg-[#4e2f1d] text-amber-300 border border-[#a38b6b]/40'
                      : 'bg-[#0d0907] text-[#6d4c3d] border border-[#5c3c2a]'
                  }`}
                >
                  {isCompleted ? '✓' : step.num}
                </div>
                <span
                  className={`text-[9px] font-bold tracking-wider transition-colors duration-300 ${
                    isActive ? 'text-amber-400' : isCompleted ? 'text-[#a38b6b]' : 'text-[#6d4c3d]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 max-w-[40px] relative">
                  <div className="absolute inset-0 bg-[#2a1f14] border border-[#5c3c2a]/30 rounded" />
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-400 transition-all duration-500 rounded"
                    style={{
                      width: isCompleted ? '100%' : '0%',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

const WizardStepIndicator = React.memo(WizardStepIndicatorInner);
export default WizardStepIndicator;
