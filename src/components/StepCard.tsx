import { Card, CardContent, CardHeader } from "@/components/ui/card";

// simple wrapper component for the different steps in the generator
function StepCard(props: any) {
  const step = props.step;
  const title = props.title;
  const children = props.children;
  
  return (
    <Card className="shadow border-gray-200">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="bg-blue-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold">
            {step}
        </div>
        <h2 className="text-md font-bold text-gray-800">{title}</h2>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

export default StepCard;
