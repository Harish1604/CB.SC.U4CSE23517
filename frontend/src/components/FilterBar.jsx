import './FilterBar.css';

function FilterBar({ activeFilter, onFilterChange }) {
  const types = ["All", "Placement", "Result", "Event"];

  return (
    <div className="filter-bar">
      {types.map((t) => (
        <button
          key={t}
          className={`filter-btn ${activeFilter === t ? "active" : ""}`}
          onClick={() => onFilterChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export default FilterBar;
