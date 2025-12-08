"use client"

export function Fireplace() {
  return (
    <div className="relative">
      {/* Fireplace Frame */}
      <div className="relative w-32 h-40 md:w-40 md:h-48">
        {/* Mantle */}
        <div className="absolute -top-2 -left-4 -right-4 h-4 bg-[#5a3d2b] rounded-t-lg shadow-lg" />

        {/* Brick Background */}
        <div className="absolute inset-0 bg-[#8b4513] rounded-b-lg overflow-hidden">
          {/* Brick Pattern */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className={`w-12 h-5 border border-[#654321] ${i % 2 === 0 ? "" : "ml-6"}`} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Fire Opening */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-24 md:w-24 md:h-28 bg-[#1a0f0a] rounded-t-full overflow-hidden">
          {/* Animated Fire */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            {/* Fire Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-500/50 rounded-full blur-xl animate-pulse" />

            {/* Fire Flames */}
            <div className="relative flex justify-center gap-1">
              <div
                className="w-3 h-12 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full animate-[flicker_0.5s_ease-in-out_infinite]"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-4 h-16 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 rounded-full animate-[flicker_0.4s_ease-in-out_infinite]"
                style={{ animationDelay: "100ms" }}
              />
              <div
                className="w-3 h-14 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full animate-[flicker_0.6s_ease-in-out_infinite]"
                style={{ animationDelay: "200ms" }}
              />
              <div
                className="w-4 h-12 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full animate-[flicker_0.5s_ease-in-out_infinite]"
                style={{ animationDelay: "150ms" }}
              />
            </div>

            {/* Logs */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
              <div className="w-10 h-3 bg-[#4a3728] rounded-full -rotate-12" />
              <div className="w-10 h-3 bg-[#3d2518] rounded-full rotate-12" />
            </div>
          </div>
        </div>

        {/* Stockings */}
        <div className="absolute -bottom-4 left-0 w-6 h-8 bg-primary rounded-b-lg" />
        <div className="absolute -bottom-4 right-0 w-6 h-8 bg-secondary rounded-b-lg" />
      </div>

      {/* Add flicker animation */}
      <style jsx>{`
        @keyframes flicker {
          0%, 100% {
            transform: scaleY(1) scaleX(1);
            opacity: 1;
          }
          50% {
            transform: scaleY(1.1) scaleX(0.9);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}



