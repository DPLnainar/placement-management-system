import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Building2, Calendar, DollarSign, Briefcase, Trophy } from 'lucide-react';

const PlacementCard = ({ placementData }) => {
    if (!placementData || !placementData.placed) {
        return null;
    }

    const { companyName, placedAt, offerDetails } = placementData;

    return (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-green-800 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Congratulations! You're Placed
                    </CardTitle>
                    <Badge className="bg-green-600 text-white px-3 py-1">
                        Placed
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company Name */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-green-700" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Company</p>
                            <p className="text-lg font-bold text-gray-900">{companyName}</p>
                        </div>
                    </div>

                    {/* CTC */}
                    {offerDetails?.ctc && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-green-700" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Package</p>
                                <p className="text-lg font-bold text-gray-900">
                                    ₹{offerDetails.ctc} LPA
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Role */}
                    {offerDetails?.offeredRole && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Briefcase className="w-5 h-5 text-green-700" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Role</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {offerDetails.offeredRole}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Placement Date */}
                    {placedAt && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-green-700" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Placed On</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {new Date(placedAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Details */}
                {offerDetails?.location && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Location:</span> {offerDetails.location}
                        </p>
                    </div>
                )}

                {offerDetails?.joiningDate && (
                    <div className="p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Expected Joining:</span>{' '}
                            {new Date(offerDetails.joiningDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                )}

                {/* Lock Message */}
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> You are now locked from applying to new job opportunities.
                        If you have any concerns, please contact the placement office.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default PlacementCard;
