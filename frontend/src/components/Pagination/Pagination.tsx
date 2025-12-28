interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, onChange }: Props) => {
  if (totalPages <= 1) return null;

  return (
    <div>
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>
        上一页
      </button>

      <span>
        {page} / {totalPages}
      </span>

      <button disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        下一页
      </button>
    </div>
  );
};

export default Pagination;
