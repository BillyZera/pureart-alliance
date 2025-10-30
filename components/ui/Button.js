
import clsx from "clsx";
export default function Button({ as:Comp='button', variant='primary', size='md', className='', ...props }){
  const base = "inline-flex items-center justify-center rounded-2xl font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-paa-600 text-white hover:bg-paa-700 focus-visible:ring-paa-600",
    outline: "border border-paa-300 text-paa-900 hover:bg-paa-50",
    subtle: "bg-paa-50 text-paa-900 hover:bg-paa-100",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
  };
  const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-5 text-base" };
  return <Comp className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
