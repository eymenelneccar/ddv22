import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, 
  DollarSign, 
  Receipt, 
  Printer, 
  Bus, 
  BarChart3,
  ExternalLink,
  UserPlus,
  Handshake,
  Plus,
  TrendingUp,
  AlertTriangle,
  Warehouse,
  Eye,
  EyeOff,
  Wallet
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const [hideNumbers, setHideNumbers] = useState(false);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/dashboard/stats"]
  });

  if (statsError && isUnauthorizedError(statsError as Error)) {
    toast({
      title: "غير مصرح",
      description: "جاري إعادة تسجيل الدخول...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useQuery({
    queryKey: ["/api/activities"]
  });

  if (activitiesError && isUnauthorizedError(activitiesError as Error)) {
    toast({
      title: "غير مصرح",
      description: "جاري إعادة تسجيل الدخول...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const formatValue = (value: string | number) => {
    if (hideNumbers) {
      return "****";
    }
    return value;
  };

  const modules = [
    {
      title: "إدارة العملاء",
      description: "إضافة العملاء وتتبع الاشتراكات والتجديدات التلقائية",
      icon: Users,
      gradient: "purple",
      link: "/customers",
      stats: [`${stats?.totalCustomers || 0} عميل`, `${stats?.expiredSubscriptions || 0} منتهي`],
    },
    {
      title: "إدارة الإدخالات",
      description: "تسجيل الحوالات والمطبوعات ورفع الفيوش الإلكترونية",
      icon: DollarSign,
      gradient: "green",
      link: "/income",
      stats: [`${stats?.monthlyIncome || 0} د.ع`, "هذا الشهر"],
    },
    {
      title: "إدارة الإخراجات",
      description: "تسجيل المصاريف والنفقات مع الأسباب التفصيلية",
      icon: Receipt,
      gradient: "red",
      link: "/expenses",
      stats: [`${stats?.totalExpenses || 0} د.ع`, "إجمالي المصاريف"],
    },
    {
      title: "قسم المطبوعات",
      description: "عرض جميع المطبوعات والإيرادات المحققة منها",
      icon: Printer,
      gradient: "orange",
      link: "/prints",
      stats: [`${stats?.printRevenue || 0} د.ع`, "إيرادات المطبوعات"],
    },
    {
      title: "إدارة الموظفين",
      description: "تسجيل الموظفين والرواتب ومقارنة المخزون",
      icon: Bus,
      gradient: "cyan",
      link: "/employees",
      stats: [`${stats?.totalEmployees || 0} موظف`, stats?.financialStatus === 'healthy' ? "الوضع صحي" : stats?.financialStatus === 'warning' ? "تحذير" : "وضع خطر"],
    },
    {
      title: "التقارير",
      description: "إنشاء وتصدير التقارير بصيغة PDF احترافية",
      icon: BarChart3,
      gradient: "indigo",
      link: "/reports",
      stats: ["تقارير شاملة", "جاهزة للتصدير"],
    },
    {
      title: "إدارة المنيوهات",
      description: "رابط مباشر لواجهة الإدارة الخارجية",
      icon: ExternalLink,
      gradient: "pink",
      link: "https://backoffice.dijital.menu/iqr",
      external: true,
      stats: ["إدارة خارجية", "dijital.menu"],
    },
    {
      title: "الرعبون والمستحقات",
      description: "تسجيل الرعبون من العملاء وتتبع المستحقات مع قوالب كاملة",
      icon: Wallet,
      gradient: "purple",
      link: "/deposits-receivables",
      stats: ["إدارة مالية", "متكاملة"],
    },
    {
      title: "المستثمرين",
      description: "مخصص للتطوير المستقبلي",
      icon: Handshake,
      gradient: "gray",
      disabled: true,
      stats: ["قريباً"],
    },
  ];

  const quickStats = [
    {
      title: "إجمالي العملاء",
      value: stats?.totalCustomers || 0,
      icon: Users,
      gradient: "green",
    },
    {
      title: "الدخل الشهري",
      value: `${stats?.monthlyIncome || 0} د.ع`,
      icon: TrendingUp,
      gradient: "blue",
    },
    {
      title: "اشتراكات منتهية",
      value: stats?.expiredSubscriptions || 0,
      icon: AlertTriangle,
      gradient: "red",
      warning: (stats?.expiredSubscriptions || 0) > 0,
    },
    {
      title: "المخزون الحالي",
      value: `${stats?.currentInventory || 0} د.ع`,
      icon: Warehouse,
      gradient: "purple",
    },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Dashboard Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2" data-testid="text-dashboard-title">لوحة التحكم الرئيسية</h2>
            <p className="text-sm sm:text-base text-gray-300" data-testid="text-dashboard-subtitle">إدارة شاملة لجميع عمليات الشركة</p>
          </div>
          <button
            onClick={() => setHideNumbers(!hideNumbers)}
            className="flex items-center space-x-2 space-x-reverse px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm sm:text-base"
            data-testid="button-toggle-visibility"
          >
            {hideNumbers ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span className="text-xs sm:text-sm">{hideNumbers ? "إظهار الأرقام" : "إخفاء الأرقام"}</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {quickStats.map((stat, index) => (
            <GlassCard 
              key={index}
              className="p-3 sm:p-6 hover:scale-105 transition-transform duration-300"
              data-testid={`card-stat-${index}`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="w-full sm:w-auto">
                  <p className="text-gray-300 text-xs sm:text-sm mb-1" data-testid={`text-stat-title-${index}`}>{stat.title}</p>
                  <p 
                    className={`text-lg sm:text-2xl font-bold ${stat.warning ? 'text-red-400' : ''}`}
                    data-testid={`text-stat-value-${index}`}
                  >
                    {statsLoading ? "..." : formatValue(stat.value)}
                  </p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 gradient-${stat.gradient} rounded-full flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Main Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
          {modules.map((module, index) => (
            <ModuleCard
              key={index}
              module={module}
              index={index}
              hideNumbers={hideNumbers}
            />
          ))}
        </div>

        {/* Recent Activities */}
        <div>
          <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" data-testid="text-recent-activities">النشاطات الأخيرة</h3>
          <GlassCard className="p-3 sm:p-6">
            <div className="space-y-4">
              {activitiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-400">جاري التحميل...</p>
                </div>
              ) : activities?.length ? (
                activities.map((activity: any, index: number) => (
                  <div 
                    key={activity.id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white/5 rounded-xl gap-2 sm:gap-0"
                    data-testid={`activity-${index}`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse w-full sm:w-auto">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 gradient-${getActivityGradient(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate sm:whitespace-normal" data-testid={`text-activity-description-${index}`}>{activity.description}</p>
                        <p className="text-xs sm:text-sm text-gray-400" data-testid={`text-activity-time-${index}`}>
                          {new Date(activity.createdAt).toLocaleString('ar-IQ')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm ${getActivityStatusColor(activity.type)} self-end sm:self-auto`}>
                      {getActivityStatus(activity.type)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p data-testid="text-no-activities">لا توجد أنشطة حديثة</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}

function ModuleCard({ module, index, hideNumbers }: { module: any; index: number; hideNumbers: boolean }) {
  const content = (
    <GlassCard
      className={`p-4 sm:p-8 ${module.disabled ? 'opacity-60' : 'hover:scale-105 cursor-pointer'} transition-all duration-500 hover:shadow-2xl animate-float group`}
      glow={!module.disabled}
      data-testid={`card-module-${index}`}
    >
      <div className="flex flex-col items-center text-center space-y-3 sm:space-y-6">
        <div className={`w-16 h-16 sm:w-20 sm:h-20 ${module.disabled ? 'bg-gray-600' : `gradient-${module.gradient}`} rounded-full flex items-center justify-center ${!module.disabled ? 'group-hover:animate-glow' : ''}`}>
          <module.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
        </div>
        <div>
          <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2" data-testid={`text-module-title-${index}`}>{module.title}</h3>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed" data-testid={`text-module-description-${index}`}>
            {module.description}
          </p>
        </div>
        {module.stats && (
          <div className="flex space-x-2 space-x-reverse">
            {module.stats.map((stat: string, statIndex: number) => (
              <span 
                key={statIndex}
                className={`px-3 py-1 ${module.disabled ? 'bg-yellow-500/20' : 'bg-white/20'} rounded-full text-xs`}
                data-testid={`text-module-stat-${index}-${statIndex}`}
              >
                {/* إخفاء الأرقام في الإحصائيات إذا كانت تحتوي على أرقام */}
                {stat.match(/\d/) && hideNumbers ? stat.replace(/\d+/g, "****") : stat}
              </span>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );

  if (module.disabled) {
    return content;
  }

  if (module.external) {
    return (
      <a
        href={module.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={module.link}>
      {content}
    </Link>
  );
}

function getActivityGradient(type: string): string {
  switch (type) {
    case 'customer_added': return 'green';
    case 'income_added': return 'blue';
    case 'expense_added': return 'red';
    case 'employee_added': return 'cyan';
    case 'subscription_renewed': return 'purple';
    default: return 'gray';
  }
}

function getActivityStatusColor(type: string): string {
  switch (type) {
    case 'customer_added': return 'text-green-400';
    case 'income_added': return 'text-blue-400';
    case 'expense_added': return 'text-red-400';
    case 'employee_added': return 'text-cyan-400';
    case 'subscription_renewed': return 'text-purple-400';
    default: return 'text-gray-400';
  }
}

function getActivityStatus(type: string): string {
  switch (type) {
    case 'customer_added': return 'مكتمل';
    case 'income_added': return 'مؤكد';
    case 'expense_added': return 'مسجل';
    case 'employee_added': return 'مضاف';
    case 'subscription_renewed': return 'مجدد';
    default: return 'منجز';
  }
}
