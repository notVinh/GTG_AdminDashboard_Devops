import React from "react";

export interface StatisticCardData {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  bgColor: string; // e.g., "blue", "yellow", "green", "red", "purple"
}

interface StatisticsCardsProps {
  cards: StatisticCardData[];
  gridCols?: "md:grid-cols-2" | "md:grid-cols-3" | "md:grid-cols-4" | "md:grid-cols-5";
}

const colorClasses = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-600",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-600",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
  },
  gray: {
    bg: "bg-gray-100",
    text: "text-gray-600",
  },
};

export default function StatisticsCards({ cards, gridCols = "md:grid-cols-3" }: StatisticsCardsProps) {
  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
      {cards.map((card, index) => {
        const colors = colorClasses[card.bgColor as keyof typeof colorClasses] || colorClasses.blue;

        return (
          <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${colors.bg} rounded-lg`}>
                <div className={`h-5 w-5 ${colors.text}`}>
                  {card.icon}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="text-sm text-gray-500">{card.label}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
