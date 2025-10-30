
export default function Textarea(props){
  return <textarea {...props} className={`w-full rounded-xl border border-paa-200 bg-white px-3 py-2 text-sm text-paa-900 placeholder-paa-400 shadow-sm focus:border-paa-400 focus:outline-none focus:ring-2 focus:ring-paa-200 ${props.className||""}`} />;
}
