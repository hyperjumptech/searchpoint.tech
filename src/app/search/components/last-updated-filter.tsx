import FilterToggleGroup, { FilterItem } from "./filter-toggle-group";

export type TLastUpdatedFilter = {
  type: "pastWeek" | "pastMonth" | "older";
  count: number;
};

const typesLabels: Record<TLastUpdatedFilter["type"], string> = {
  pastWeek: "Past 7 Days",
  pastMonth: "Past 30 Days",
  older: "Older",
};

export default function LastUpdatedFilter({
  data,
}: {
  data: TLastUpdatedFilter[];
}) {
  const items: FilterItem<TLastUpdatedFilter["type"]>[] = data.map((item) => ({
    value: item.type,
    count: item.count,
  }));

  return <FilterToggleGroup items={items} labels={typesLabels} />;
}
