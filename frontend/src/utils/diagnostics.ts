type DiagnosticDetails = Record<string, string | number | boolean | undefined>;

interface DiagnosticContext {
  source: string;
  operation: string;
  details?: DiagnosticDetails;
}

export const reportDiagnostic = ({
  source,
  operation,
  details,
}: DiagnosticContext) => {
  console.error('[monitoring]', {
    source,
    operation,
    ...details,
  });
};
