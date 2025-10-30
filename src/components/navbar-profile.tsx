type Props = {
  user: {
    name?: string;
    email?: string;
  };
} & React.HTMLAttributes<HTMLDivElement>;

export default function NavbarProfile({ user, ...props }: Props) {
  return (
    <div {...props}>
      <p className="text-sm">{user?.name}</p>
      <p className="text-xs text-gray-500">{user?.email}</p>
    </div>
  );
}
