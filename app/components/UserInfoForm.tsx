"use client";

import { useState } from "react";
import { config } from "../config";

interface UserInfoFormProps {
    onSubmit: (userInfo: Record<string, string>) => void;
}

export default function UserInfoForm({ onSubmit }: UserInfoFormProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        config.userInfo.fields.forEach(field => {
            if (field.required && !formData[field.name]?.trim()) {
                newErrors[field.name] = `${field.label} is required`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="w-full max-w-md">
                <h1 className="text-4xl font-bold mb-2 text-center">{config.appName}</h1>
                <p className="text-gray-400 text-center mb-8">{config.appDescription}</p>

                <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-8 space-y-6">
                    <h2 className="text-2xl font-semibold mb-4">Enter Your Information</h2>

                    {config.userInfo.fields.map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium mb-2">
                                {field.label}
                                {field.required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            <input
                                type={field.type}
                                name={field.name}
                                placeholder={field.placeholder}
                                value={formData[field.name] || ""}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className={`w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                                    errors[field.name]
                                        ? 'ring-2 ring-red-500'
                                        : 'focus:ring-blue-500'
                                }`}
                            />
                            {errors[field.name] && (
                                <p className="text-red-400 text-sm mt-1">{errors[field.name]}</p>
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        className="w-full px-8 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition"
                    >
                        Start Interview
                    </button>
                </form>
            </div>
        </div>
    );
}
