import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreditCardIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

export default function PaymentTab() {
    const cards = [
        {
            type: "VISA",
            name: "Luis Fonsi",
            number: "4802 - 2215 - 1183 - 4289",
            gradient: "bg-gradient-to-br from-purple-600 via-pink-600 to-red-500"
        },
        {
            type: "Mastercard",
            name: "Emiway Bantai",
            number: "2221 - 0057 - 4680 - 2089",
            gradient: "bg-gradient-to-br from-slate-700 via-slate-600 to-orange-800"
        },
        {
            type: "DISCOVER",
            name: "J Balvin",
            number: "6011 - 1111 - 1111 - 1117",
            gradient: "bg-gradient-to-br from-green-500 to-green-600"
        }
    ];

    return (
        <TabsContent value="payment" className="m-0 p-8 w-full">
            <div className="mb-8">
                <h1 className="text-2xl! font-bold mb-6">Payment Method</h1>
                <hr className="border-gray-200" />
            </div>

            <div className="mb-6">
                <h2 className="text-xl! font-semibold mb-6">Manage Cards</h2>

                {/* Credit Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                    {cards.map((card, index) => (
                        <div
                            key={index}
                            className={`${card.gradient} rounded-2xl p-6 text-white h-[180px] flex flex-col justify-between shadow-lg`}
                        >
                            <div className="flex items-start justify-between">
                                <span className="text-sm!">Credit</span>
                                <span className="text-sm! font-bold">
                                    {card.type === "Mastercard" ? (
                                        <div className="flex gap-[-8px]">
                                            <div className="w-8 h-8 rounded-full bg-red-500 opacity-80"></div>
                                            <div className="w-8 h-8 rounded-full bg-orange-400 opacity-80 -ml-4"></div>
                                        </div>
                                    ) : (
                                        card.type
                                    )}
                                </span>
                            </div>

                            <div>
                                <p className="text-base! mb-1">{card.name}</p>
                                <p className="text-sm! tracking-wider">{card.number}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <Button className="bg-[#2CB5E8] hover:bg-[#25a0d1] text-white px-6 py-6 rounded-full text-base">
                        <CreditCardIcon className="w-5 h-5 mr-2" />
                        Add Payment Method
                    </Button>
                    <Button
                        variant="outline"
                        className="border-2 border-gray-800 text-gray-800 hover:bg-gray-50 px-6 py-6 rounded-full text-base"
                    >
                        <PencilSquareIcon className="w-5 h-5 mr-2" />
                        Edit Payment Method
                    </Button>
                </div>
            </div>
        </TabsContent>
    );
}