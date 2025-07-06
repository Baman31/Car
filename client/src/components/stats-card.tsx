interface StatsCardProps {
  icon: string;
  iconColor: string;
  title: string;
  value: string | number;
}

export default function StatsCard({ icon, iconColor, title, value }: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <i className={`${icon} text-2xl ${iconColor}`}></i>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
