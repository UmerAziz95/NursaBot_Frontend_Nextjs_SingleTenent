import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    UserCircleIcon,
    BellIcon,
    PaintBrushIcon,
    CreditCardIcon,
    CircleStackIcon,
    QuestionMarkCircleIcon,
    Cog6ToothIcon,
    UserIcon,
    ArrowLeftIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

export default function SubscriptionDialog({ children }) {
    const plans = [
        {
            name: "Basic",
            price: "0€",
            isPopular: false,
            buttonText: "Your Current Plan",
            buttonVariant: "outline",
            features: [
                "Cupidatat non proident,",
                "Exercitation ullamco",
                "Adipiscing elit",
                "Occaecat",
                "Dolore magna aliqua"
            ]
        },
        {
            name: "Standard",
            price: "49€",
            isPopular: true,
            buttonText: "Get Standard",
            buttonVariant: "default",
            features: [
                "Cupidatat non proident,",
                "Exercitation ullamco",
                "Adipiscing elit",
                "Occaecat",
                "Dolore magna aliqua"
            ]
        },
        {
            name: "Pro",
            price: "49€",
            isPopular: false,
            buttonText: "Get Pro",
            buttonVariant: "outline",
            features: [
                "Cupidatat non proident,",
                "Exercitation ullamco",
                "Adipiscing elit",
                "Occaecat",
                "Dolore magna aliqua"
            ]
        },
        {
            name: "Exclusive",
            price: "99€",
            isPopular: false,
            buttonText: "Get Exclusive",
            buttonVariant: "outline",
            features: [
                "Cupidatat non proident,",
                "Exercitation ullamco",
                "Adipiscing elit",
                "Occaecat",
                "Dolore magna aliqua"
            ]
        }
    ];

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[1400px] p-0 gap-0 max-h-[90vh] py-4!">

                {/* Right Content Area */}
                <div className="overflow-y-auto w-full h-full!">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-2xl! md:text-5xl font-bold mb-2">
                                Join 100+ Sponsors Who
                            </h1>
                            <h1 className="text-2xl! md:text-5xl font-bold">
                                Support Monthly
                            </h1>
                        </div>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                            {plans.map((plan, index) => (
                                <div
                                    key={index}
                                    className={`relative bg-white rounded-3xl p-8 shadow-sm  ${plan.isPopular ? 'border-2 border-[#2CB5E8]' : 'border border-gray-200'
                                        }`}
                                >
                                    {/* Popular Badge */}
                                    {plan.isPopular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-[#2CB5E8] text-white text-xs font-semibold px-4 py-1 rounded-full uppercase">
                                                Popular Choice
                                            </span>
                                        </div>
                                    )}

                                    {/* Plan Name */}
                                    <h2 className="text-2xl! font-bold text-center mb-6">{plan.name}</h2>

                                    {/* Price */}
                                    <div className="text-center mb-2">
                                        <span className="text-lg! md:text-6xl font-bold">{plan.price}</span>
                                    </div>
                                    <p className="text-center text-gray-500 text-sm mb-8">per month</p>

                                    {/* Features */}
                                    <div className="space-y-4 mb-8">
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <CheckIcon className="w-5 h-5 text-[#2CB5E8] flex-shrink-0 mt-0.5" />
                                                <span className="text-base text-gray-700">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Button */}
                                    <Button
                                        className={`w-full py-6 text-base font-semibold rounded-full ${plan.isPopular
                                            ? 'bg-[#2CB5E8] hover:bg-[#25a0d1] text-white'
                                            : plan.name === 'Basic'
                                                ? 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                                                : 'bg-white border-2 border-gray-800 text-gray-800 hover:bg-gray-50'
                                            }`}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </div>
                            ))}
                        </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}