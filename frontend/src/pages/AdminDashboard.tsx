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
import {
  chatWithAdminInsightAgent,
  generateAdminInsights,
  investigateAdminAlert,
} from '../api/admin-insights';
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

const formatDelta = (value: number | null) => {
  if (value === null) return 'no baseline';
  if (value > 0) return `+${value}%`;
  return `${value}%`;
};

const AdminDashboard = () => {
  const { brief, summary, analytics, alerts, isLoading, error, refresh } =
    useAdminDashboardPage();
  const [insightResult, setInsightResult] =
    useState<AdminInsightResponse | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [alertInsightResult, setAlertInsightResult] =
    useState<AdminInsightResponse | null>(null);
  const [investigatingAlertId, setInvestigatingAlertId] = useState<
    string | null
  >(null);
  const [alertInsightError, setAlertInsightError] = useState<string | null>(
    null,
  );
  const [alertFollowUpQuestion, setAlertFollowUpQuestion] = useState('');
  const [adminChatQuestion, setAdminChatQuestion] = useState('');
  const [adminChatResult, setAdminChatResult] =
    useState<AdminInsightResponse | null>(null);
  const [isAskingAdminChat, setIsAskingAdminChat] = useState(false);
  const [adminChatError, setAdminChatError] = useState<string | null>(null);

  const generateInsights = async () => {
    setIsGeneratingInsights(true);
    setInsightError(null);

    try {
      const result = await generateAdminInsights({
        range: '7d',
        question: 'What needs operational attention this week?',
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

  const investigateAlert = async (alertId: string, question?: string) => {
    setInvestigatingAlertId(alertId);
    setAlertInsightError(null);

    try {
      const result = await investigateAdminAlert({
        range: '7d',
        alertId,
        question,
      });
      setAlertInsightResult(result);
      setAlertFollowUpQuestion('');
    } catch (err) {
      setAlertInsightError(
        err instanceof Error ? err.message : 'Could not investigate alert',
      );
    } finally {
      setInvestigatingAlertId(null);
    }
  };

  const askAdminInsightAgent = async (question: string) => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) return;

    setIsAskingAdminChat(true);
    setAdminChatError(null);

    try {
      const result = await chatWithAdminInsightAgent({
        range: '7d',
        question: trimmedQuestion,
      });
      setAdminChatResult(result);
      setAdminChatQuestion('');
    } catch (err) {
      setAdminChatError(
        err instanceof Error
          ? err.message
          : 'Could not answer admin insight question',
      );
    } finally {
      setIsAskingAdminChat(false);
    }
  };

  return (
    <AdminLayout
      title="Dashboard"
      action={<AdminRefreshButton onClick={refresh} />}
    >
      {isLoading && <AdminStatusText>Loading dashboard...</AdminStatusText>}
      {error && <AdminStatusText tone="error">{error}</AdminStatusText>}

      {!isLoading && !error && brief && summary && analytics && (
        <>
          <section className={classes.DailyBrief}>
            <div className={classes.DailyBriefHeader}>
              <div>
                <p className={classes.MetricLabel}>AI Operations Daily Brief</p>
                <h2>Yesterday at a glance</h2>
              </div>
              <span>{brief.date}</span>
            </div>

            <div className={classes.BriefMetricGrid}>
              <article>
                <p>Revenue</p>
                <strong>
                  {formatCurrency(brief.metrics.revenueCents.value)}
                </strong>
                <span>
                  {formatDelta(brief.metrics.revenueCents.deltaPercent)} vs same
                  weekday last week
                </span>
              </article>
              <article>
                <p>Orders</p>
                <strong>{brief.metrics.orderCount.value}</strong>
                <span>
                  {formatDelta(brief.metrics.orderCount.deltaPercent)} vs same
                  weekday last week
                </span>
              </article>
              <article>
                <p>Average order</p>
                <strong>
                  {formatCurrency(brief.metrics.averageOrderValueCents.value)}
                </strong>
                <span>
                  {formatDelta(
                    brief.metrics.averageOrderValueCents.deltaPercent,
                  )}{' '}
                  vs same weekday last week
                </span>
              </article>
            </div>

            <div className={classes.BriefBody}>
              <div>
                <p className={classes.MetricLabel}>Highlights</p>
                <ul>
                  {brief.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className={classes.MetricLabel}>Worth checking</p>
                <ul>
                  {brief.worthChecking.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

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
            className={classes.AlertSection}
            aria-label="Analytics alerts"
          >
            <div className={classes.AlertHeader}>
              <div>
                <p className={classes.MetricLabel}>Realtime operations</p>
                <h2>Analytics alerts</h2>
              </div>
              <span>{alerts.length} active</span>
            </div>
            {alerts.length === 0 ? (
              <AdminStatusText>
                No active analytics alerts for the current 7-day window.
              </AdminStatusText>
            ) : (
              <div className={classes.AlertGrid}>
                {alerts.map((alert) => (
                  <article className={classes.AlertCard} key={alert.id}>
                    <div className={classes.AlertMeta}>
                      <span>{alert.type.replaceAll('_', ' ')}</span>
                      <b>{alert.severity}</b>
                    </div>
                    <h3>{alert.title}</h3>
                    <p>{alert.message}</p>
                    <ul>
                      {alert.evidence.map((evidence) => (
                        <li key={evidence}>{evidence}</li>
                      ))}
                    </ul>
                    <AdminButton
                      type="button"
                      onClick={() => {
                        void investigateAlert(alert.id);
                      }}
                      disabled={investigatingAlertId === alert.id}
                    >
                      {investigatingAlertId === alert.id
                        ? 'Investigating...'
                        : 'Investigate with AI'}
                    </AdminButton>
                  </article>
                ))}
              </div>
            )}

            {alertInsightError && (
              <AdminStatusText tone="error">
                {alertInsightError}
              </AdminStatusText>
            )}

            {alertInsightResult && (
              <article className={classes.AlertInvestigation}>
                <div className={classes.AlertInvestigationHeader}>
                  <div>
                    <p className={classes.MetricLabel}>
                      AI alert investigation
                    </p>
                    <h3>
                      {alertInsightResult.alert?.title ?? 'Investigation'}
                    </h3>
                  </div>
                  <span>{alertInsightResult.run.model}</span>
                </div>
                <p>{alertInsightResult.summary}</p>
                <div className={classes.InsightGrid}>
                  {alertInsightResult.insights.map((insight) => (
                    <article
                      className={classes.InsightCard}
                      key={`alert-${insight.type}-${insight.title}`}
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
                {alertInsightResult.orderEvidence &&
                  alertInsightResult.orderEvidence.length > 0 && (
                    <div className={classes.OrderEvidenceList}>
                      <p className={classes.MetricLabel}>Order evidence</p>
                      {alertInsightResult.orderEvidence.map((order) => (
                        <article
                          className={classes.OrderEvidenceCard}
                          key={order.orderId}
                        >
                          <div>
                            <b>#{order.orderId.slice(-6)}</b>
                            <span>
                              {formatOrderStatus(order.status as OrderStatus)}
                            </span>
                          </div>
                          <p>
                            {formatCurrency(order.totalCents)} ·{' '}
                            {order.itemCount} items
                            {order.paymentStatus
                              ? ` · payment ${order.paymentStatus}`
                              : ''}
                          </p>
                          <small>{order.items.join(', ')}</small>
                        </article>
                      ))}
                    </div>
                  )}
                <form
                  className={classes.AlertFollowUpForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const question = alertFollowUpQuestion.trim();
                    const alertId = alertInsightResult.alert?.id;

                    if (!question || !alertId) return;

                    void investigateAlert(alertId, question);
                  }}
                >
                  <input
                    type="text"
                    value={alertFollowUpQuestion}
                    onChange={(event) => {
                      setAlertFollowUpQuestion(event.target.value);
                    }}
                    placeholder="Ask a follow-up about this alert"
                    maxLength={240}
                  />
                  <AdminButton
                    type="submit"
                    disabled={
                      !alertFollowUpQuestion.trim() ||
                      investigatingAlertId === alertInsightResult.alert?.id
                    }
                  >
                    {investigatingAlertId === alertInsightResult.alert?.id
                      ? 'Asking...'
                      : 'Ask'}
                  </AdminButton>
                </form>
              </article>
            )}
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
                <p className={classes.MetricLabel}>
                  AI Operations Insight Agent
                </p>
                <h2>What needs attention</h2>
              </div>
              <AdminButton
                type="button"
                onClick={() => {
                  void generateInsights();
                }}
                disabled={isGeneratingInsights}
              >
                {isGeneratingInsights
                  ? 'Investigating...'
                  : 'Find what needs attention'}
              </AdminButton>
            </div>

            <form
              className={classes.AdminChatForm}
              onSubmit={(event) => {
                event.preventDefault();
                void askAdminInsightAgent(adminChatQuestion);
              }}
            >
              <input
                type="text"
                value={adminChatQuestion}
                onChange={(event) => {
                  setAdminChatQuestion(event.target.value);
                }}
                placeholder="Ask about an anomaly, weak item, payment issue, or order status"
                maxLength={240}
              />
              <AdminButton
                type="submit"
                disabled={!adminChatQuestion.trim() || isAskingAdminChat}
              >
                {isAskingAdminChat ? 'Asking...' : 'Ask agent'}
              </AdminButton>
            </form>

            {adminChatError && (
              <AdminStatusText tone="error">{adminChatError}</AdminStatusText>
            )}

            {adminChatResult && (
              <article className={classes.AdminChatResult}>
                <article className={classes.InsightSummary}>
                  <p>{adminChatResult.summary}</p>
                  <dl>
                    <div>
                      <dt>Model</dt>
                      <dd>{adminChatResult.run.model}</dd>
                    </div>
                    <div>
                      <dt>Tools</dt>
                      <dd>{adminChatResult.run.toolsUsed.join(', ')}</dd>
                    </div>
                    <div>
                      <dt>Latency</dt>
                      <dd>{adminChatResult.run.latencyMs}ms</dd>
                    </div>
                    <div>
                      <dt>Trace</dt>
                      <dd>{adminChatResult.run.id}</dd>
                    </div>
                  </dl>
                </article>

                <div className={classes.InsightGrid}>
                  {adminChatResult.insights.map((insight) => (
                    <article
                      className={classes.InsightCard}
                      key={`chat-${insight.type}-${insight.title}`}
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

                {adminChatResult.orderEvidence &&
                  adminChatResult.orderEvidence.length > 0 && (
                    <div className={classes.OrderEvidenceList}>
                      <p className={classes.MetricLabel}>Order evidence</p>
                      {adminChatResult.orderEvidence.map((order) => (
                        <article
                          className={classes.OrderEvidenceCard}
                          key={`chat-${order.orderId}`}
                        >
                          <div>
                            <b>#{order.orderId.slice(-6)}</b>
                            <span>
                              {formatOrderStatus(order.status as OrderStatus)}
                            </span>
                          </div>
                          <p>
                            {formatCurrency(order.totalCents)} ·{' '}
                            {order.itemCount} items
                            {order.paymentStatus
                              ? ` · payment ${order.paymentStatus}`
                              : ''}
                          </p>
                          <small>{order.items.join(', ')}</small>
                        </article>
                      ))}
                    </div>
                  )}
              </article>
            )}

            {insightError && (
              <AdminStatusText tone="error">{insightError}</AdminStatusText>
            )}

            {!insightResult && !insightError && (
              <AdminStatusText>
                Find the operational issues most worth checking from verified
                7-day analytics.
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
