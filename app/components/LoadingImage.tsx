import React from 'react';
import { DotSpinner } from 'ldrs/react';
import 'ldrs/react/DotSpinner.css';

const LoadingImage = ({ 
  title = "Cargando comanda", 
  subtitle = "Obteniendo detalles...",
  className = "",
  size = "md", // xs, sm, md, lg, xl
  color = "#2563eb", // blue-600 por defecto
  speed = "0.9"
}) => {
  // Tamaños del spinner basados en el prop size
  const spinnerSizes = {
    xs: "24",
    sm: "32", 
    md: "40",
    lg: "48",
    xl: "56"
  };

  const textSizes = {
    xs: { title: "text-sm", subtitle: "text-xs" },
    sm: { title: "text-base", subtitle: "text-sm" },
    md: { title: "text-lg", subtitle: "text-sm" },
    lg: { title: "text-xl", subtitle: "text-base" },
    xl: { title: "text-2xl", subtitle: "text-lg" }
  };

  const spinnerSize = spinnerSizes[size];
  const titleSize = textSizes[size].title;
  const subtitleSize = textSizes[size].subtitle;

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
      <div className="text-center">
        {/* LDRS DotSpinner */}
        <div className="mb-8">
          <DotSpinner
            size={spinnerSize}
            speed={speed}
            color={color}
          />
        </div>
        
        {/* Text content with Windows 11 styling */}
        <div className="space-y-3">
          <p className={`${titleSize} font-normal text-gray-800`}>{title}</p>
          <p className={`${subtitleSize} text-gray-600 font-light`}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingImage;