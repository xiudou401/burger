import classes from './Pagination.module.css';
interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, onChange }: Props) => {
  if (totalPages <= 1) return null;

  return (
    <div className={classes.Pagination}>
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>

      <span>
        {page} / {totalPages}
      </span>

      <button disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
};

export default Pagination;
