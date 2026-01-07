import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    label?: string;
    placeholder?: string;
}

export function CustomSelect({ value, onChange, options, label, placeholder }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="space-y-2 relative" ref={dropdownRef}>
            {label && <label className="block text-xs font-bold text-slate-500 uppercase">{label}</label>}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all duration-200
          ${isOpen
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white shadow-lg shadow-blue-500/10'
                        : 'border-slate-200 bg-sky-50/50 hover:bg-white hover:border-blue-300'
                    }`}
            >
                <span className={`block truncate ${!value ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    {value || placeholder || 'Select option'}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
                />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl shadow-blue-900/10 border border-slate-100 overflow-hidden animate-fade-in-down max-h-60 overflow-y-auto custom-scrollbar">
                    <ul className="py-1">
                        {options.map((option) => (
                            <li
                                key={option}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors
                  ${value === option
                                        ? 'bg-blue-50 text-blue-700 font-bold'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <span>{option}</span>
                                {value === option && <Check size={16} className="text-blue-600" />}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
