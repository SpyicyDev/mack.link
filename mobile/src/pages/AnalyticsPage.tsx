import { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonRefresher,
  IonRefresherContent,
  IonDatetime,
  IonSegment,
  IonSegmentButton,
  IonLoading,
} from '@ionic/react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  useAnalyticsOverview,
  useAnalyticsTimeseries,
  useAnalyticsBreakdown,
} from '../hooks/useAnalytics';
import { useLinks } from '../hooks/useLinks';
import { RefresherEventDetail } from '@ionic/react';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const AnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [dimension, setDimension] = useState('ref');
  const [scope, setScope] = useState<'all' | 'shortcode'>('all');
  const [selectedShortcode, setSelectedShortcode] = useState('');

  const { data: links = {} } = useLinks();
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useAnalyticsOverview();
  const { data: timeseries, isLoading: timeseriesLoading, refetch: refetchTimeseries } = useAnalyticsTimeseries({
    from: dateRange.from,
    to: dateRange.to,
    scope,
    shortcode: scope === 'shortcode' ? selectedShortcode : undefined,
  });
  const { data: breakdown, isLoading: breakdownLoading, refetch: refetchBreakdown } = useAnalyticsBreakdown({
    from: dateRange.from,
    to: dateRange.to,
    dimension,
    scope,
    shortcode: scope === 'shortcode' ? selectedShortcode : undefined,
  });

  const linkOptions = Object.keys(links);

  useEffect(() => {
    if (scope === 'shortcode' && linkOptions.length > 0 && !selectedShortcode) {
      setSelectedShortcode(linkOptions[0]);
    }
  }, [links, scope, selectedShortcode, linkOptions]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([
      refetchOverview(),
      refetchTimeseries(),
      refetchBreakdown(),
    ]);
    event.detail.complete();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatNumber(value),
        },
      },
    },
  };

  const timeseriesData = {
    labels: timeseries?.map((point: any) => new Date(point.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Clicks',
        data: timeseries?.map((point: any) => point.clicks) || [],
        borderColor: 'var(--ion-color-primary)',
        backgroundColor: 'var(--ion-color-primary-tint)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const breakdownData = {
    labels: breakdown?.slice(0, 10).map((item: any) => item.dimension || 'Unknown') || [],
    datasets: [
      {
        label: 'Clicks',
        data: breakdown?.slice(0, 10).map((item: any) => item.clicks) || [],
        backgroundColor: 'var(--ion-color-primary)',
      },
    ],
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Analytics</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Overview Cards */}
        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <IonCard>
                <IonCardContent className="ion-text-center">
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {overview ? formatNumber(overview.totalClicks) : '-'}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--ion-color-medium)' }}>Total Clicks</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6">
              <IonCard>
                <IonCardContent className="ion-text-center">
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {overview ? formatNumber(overview.totalLinks) : '-'}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--ion-color-medium)' }}>Total Links</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="6">
              <IonCard>
                <IonCardContent className="ion-text-center">
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {overview ? formatNumber(overview.todayClicks) : '-'}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--ion-color-medium)' }}>Today</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6">
              <IonCard>
                <IonCardContent className="ion-text-center">
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {overview ? formatNumber(overview.recentClicks) : '-'}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--ion-color-medium)' }}>Recent</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Filters */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Filters</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Scope</IonLabel>
              <IonSegment
                value={scope}
                onIonChange={(e) => setScope(e.detail.value as 'all' | 'shortcode')}
              >
                <IonSegmentButton value="all">
                  <IonLabel>All Links</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="shortcode">
                  <IonLabel>Single Link</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </IonItem>

            {scope === 'shortcode' && (
              <IonItem>
                <IonLabel position="stacked">Select Link</IonLabel>
                <IonSelect
                  value={selectedShortcode}
                  onSelectionChange={(e) => setSelectedShortcode(e.detail.value)}
                >
                  {linkOptions.map((shortcode) => (
                    <IonSelectOption key={shortcode} value={shortcode}>
                      {shortcode}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            )}

            <IonItem>
              <IonLabel position="stacked">From Date</IonLabel>
              <IonDatetime
                value={dateRange.from}
                onIonChange={(e) => setDateRange({ ...dateRange, from: e.detail.value as string })}
                presentation="date"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">To Date</IonLabel>
              <IonDatetime
                value={dateRange.to}
                onIonChange={(e) => setDateRange({ ...dateRange, to: e.detail.value as string })}
                presentation="date"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Breakdown Dimension</IonLabel>
              <IonSelect
                value={dimension}
                onSelectionChange={(e) => setDimension(e.detail.value)}
              >
                <IonSelectOption value="ref">Referrer</IonSelectOption>
                <IonSelectOption value="ua">User Agent</IonSelectOption>
                <IonSelectOption value="country">Country</IonSelectOption>
                <IonSelectOption value="shortcode">Shortcode</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Time Series Chart */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Clicks Over Time</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {timeseries && timeseries.length > 0 ? (
              <div style={{ height: '250px' }}>
                <Line data={timeseriesData} options={chartOptions} />
              </div>
            ) : (
              <div className="ion-text-center" style={{ padding: '2rem' }}>
                No data available for selected period
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Breakdown Chart */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Top {dimension.charAt(0).toUpperCase() + dimension.slice(1)}s</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {breakdown && breakdown.length > 0 ? (
              <div style={{ height: '300px' }}>
                <Bar data={breakdownData} options={chartOptions} />
              </div>
            ) : (
              <div className="ion-text-center" style={{ padding: '2rem' }}>
                No data available for selected period
              </div>
            )}
          </IonCardContent>
        </IonCard>

        <IonLoading
          isOpen={overviewLoading || timeseriesLoading || breakdownLoading}
          message="Loading analytics..."
        />
      </IonContent>
    </IonPage>
  );
};

export default AnalyticsPage;