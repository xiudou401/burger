import { useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import AdminButton from '../components/Admin/AdminButton';
import AdminRefreshButton from '../components/Admin/AdminRefreshButton';
import AdminStatusText from '../components/Admin/AdminStatusText';
import classes from './AdminDashboard.module.css';
import { useAdminDashboardPage } from './hooks/useAdminDashboardPage';
import { formatCurrency } from '../utils/currency';
import { formatOrderStatus } from '../utils/order';
import type { OrderStatus } from '../types/order';
import { generateAdminInsights } from '../api/admin-insights';
import type { AdminInsightResponse } from '../types/admin-insight';

const ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
];

const formatMinutes = (value: number | null) =>
  value === null ? 'N/A' : `${value} min`;

const AdminDashboard = () => {
  const { summary, analytics, isLoading, error, refresh } =
    useAdminDashboardPage();
  const [insightResult, setInsightResult] =
    useState<AdminInsightResponse | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const generateInsights = async () => {
    setIsGeneratingInsights(true);
    setInsightError(null);

    try {
      const result = await generateAdminInsights({
        range: '7d',
        question: 'What should we improve this week?',
      });
      setInsightResult(result);
    } catch (err) {
      setInsightError(
        err instanceof Error ? err.message : 'Could not generate insights',
      );
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  return (
    <AdminLayout
      title="Dashboard"
      action={<AdminRefreshButton onClick={refresh} />}
    >
      {isLoading && <AdminStatusText>Loading dashboard...</AdminStatusText>}
      {error && <AdminStatusText tone="error">{error}</AdminStatusText>}

      {!isLoading && !error && summary && analytics && (
        <>
          <section className={classes.MetricGrid} aria-label="Today metrics">
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>Today revenue</p>
              <p className={classes.MetricValue}>
                {formatCurrency(summary.todayRevenueCents)}
              </p>
            </article>
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>Today orders</p>
              <p className={classes.MetricValue}>{summary.todayOrderCount}</p>
            </article>
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>Active orders</p>
              <p className={classes.MetricValue}>{summary.activeOrders}</p>
            </article>
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>Avg prep time</p>
              <p className={classes.MetricValue}>
                {formatMinutes(summary.averagePreparationMinutes)}
              </p>
            </article>
          </section>

          <section className={classes.AnalyticsHeader}>
            <div>
              <p className={classes.MetricLabel}>Analytics foundation</p>
              <h2>Last 7 days</h2>
            </div>
            <p>
              Metrics are calculated by the backend from saved order records.
            </p>
          </section>

          <section
            className={classes.MetricGrid}
            aria-label="Seven day metrics"
          >
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>7-day revenue</p>
              <p className={classes.MetricValue}>
                {formatCurrency(analytics.revenueCents)}
              </p>
            </article>
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>Orders</p>
              <p className={classes.MetricValue}>{analytics.orderCount}</p>
            </article>
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>Paid orders</p>
              <p className={classes.MetricValue}>{analytics.paidOrderCount}</p>
            </article>
            <article className={classes.MetricCard}>
              <p className={classes.MetricLabel}>Average order</p>
              <p className={classes.MetricValue}>
                {formatCurrency(analytics.averageOrderValueCents)}
              </p>
            </article>
          </section>

          <section className={classes.PanelGrid}>
            <article className={classes.Panel}>
              <h2 className={classes.PanelTitle}>Orders by status</h2>
              <div className={classes.StatusGrid}>
                {ORDER_STATUSES.map((status) => (
                  <div className={classes.StatusRow} key={status}>
                    <span className={classes.StatusName}>
                      {formatOrderStatus(status)}
                    </span>
                    <span className={classes.StatusCount}>
                      {summary.ordersByStatus[status]}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className={classes.Panel}>
              <h2 className={classes.PanelTitle}>Top selling items</h2>
              {summary.topItems.length === 0 ? (
                <AdminStatusText>No paid orders yet today.</AdminStatusText>
              ) : (
                <div className={classes.TopItems}>
                  {summary.topItems.map((item) => (
                    <div className={classes.TopItem} key={item.menuItemId}>
                      <span className={classes.ItemName}>{item.name}</span>
                      <span className={classes.ItemMeta}>
                        {item.quantitySold} sold ·{' '}
                        {formatCurrency(item.revenueCents)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className={classes.AnalyticsGrid}>
            <article className={classes.Panel}>
              <h2 className={classes.PanelTitle}>Category sales</h2>
              <div className={classes.TableRows}>
                {analytics.categorySales.map((category) => (
                  <div className={classes.TableRow} key={category.category}>
                    <span className={classes.ItemName}>
                      {category.category}
                    </span>
                    <span className={classes.ItemMeta}>
                      {category.quantitySold} sold ·{' '}
                      {formatCurrency(category.revenueCents)}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className={classes.Panel}>
              <h2 className={classes.PanelTitle}>Payment outcomes</h2>
              <div className={classes.TableRows}>
                {analytics.paymentStatusCounts.map((entry) => (
                  <div className={classes.TableRow} key={entry.status}>
                    <span className={classes.ItemName}>{entry.status}</span>
                    <span className={classes.ItemMeta}>{entry.count}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className={classes.Panel}>
              <h2 className={classes.PanelTitle}>7-day top items</h2>
              <div className={classes.TableRows}>
                {analytics.topItems.map((item) => (
                  <div className={classes.TableRow} key={item.menuItemId}>
                    <span className={classes.ItemName}>{item.name}</span>
                    <span className={classes.ItemMeta}>
                      {item.quantitySold} sold ·{' '}
                      {formatCurrency(item.revenueCents)}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className={classes.Panel}>
              <h2 className={classes.PanelTitle}>Lower selling items</h2>
              <div className={classes.TableRows}>
                {analytics.underperformingItems.map((item) => (
                  <div className={classes.TableRow} key={item.menuItemId}>
                    <span className={classes.ItemName}>{item.name}</span>
                    <span className={classes.ItemMeta}>
                      {item.quantitySold} sold ·{' '}
                      {formatCurrency(item.revenueCents)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className={classes.InsightSection}>
            <div className={classes.InsightHeader}>
              <div>
                <p className={classes.MetricLabel}>AI Admin Insight Agent</p>
                <h2>Operational insights</h2>
              </div>
              <AdminButton
                type="button"
                onClick={() => {
                  void generateInsights();
                }}
                disabled={isGeneratingInsights}
              >
                {isGeneratingInsights ? 'Generating...' : 'Generate insights'}
              </AdminButton>
            </div>

            {insightError && (
              <AdminStatusText tone="error">{insightError}</AdminStatusText>
            )}

            {!insightResult && !insightError && (
              <AdminStatusText>
                Generate AI insights from verified 7-day analytics.
              </AdminStatusText>
            )}

            {insightResult && (
              <>
                <article className={classes.InsightSummary}>
                  <p>{insightResult.summary}</p>
                  <dl>
                    <div>
                      <dt>Model</dt>
                      <dd>{insightResult.run.model}</dd>
                    </div>
                    <div>
                      <dt>Tool</dt>
                      <dd>{insightResult.run.toolsUsed.join(', ')}</dd>
                    </div>
                    <div>
                      <dt>Latency</dt>
                      <dd>{insightResult.run.latencyMs}ms</dd>
                    </div>
                    <div>
                      <dt>Trace</dt>
                      <dd>{insightResult.run.id}</dd>
                    </div>
                  </dl>
                </article>

                <div className={classes.InsightGrid}>
                  {insightResult.insights.map((insight) => (
                    <article
                      className={classes.InsightCard}
                      key={`${insight.type}-${insight.title}`}
                    >
                      <div className={classes.InsightMeta}>
                        <span>{insight.type}</span>
                        <b>{insight.severity}</b>
                      </div>
                      <h3>{insight.title}</h3>
                      <ul>
                        {insight.evidence.map((evidence) => (
                          <li key={evidence}>{evidence}</li>
                        ))}
                      </ul>
                      <p>{insight.suggestedAction}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
