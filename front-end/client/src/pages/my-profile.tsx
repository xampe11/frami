import { useState } from "react";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Globe,
  Twitter,
  Camera,
  Activity,
  Calendar,
  ExternalLink,
  Edit3,
} from "lucide-react";

// Mock activity data
const mockActivities = [
  {
    id: 1,
    type: "project_backed",
    title: "Backed DeFi Protocol Alpha",
    amount: "0.5 ETH",
    date: "2025-01-25",
    status: "completed",
  },
  {
    id: 2,
    type: "nft_staked",
    title: "Staked 3 FounderNFTs",
    amount: "3 NFTs",
    date: "2025-01-24",
    status: "active",
  },
  {
    id: 3,
    type: "rewards_claimed",
    title: "Claimed Staking Rewards",
    amount: "0.12 ETH",
    date: "2025-01-23",
    status: "completed",
  },
  {
    id: 4,
    type: "project_created",
    title: "Created Web3 Gaming Project",
    amount: "New Project",
    date: "2025-01-22",
    status: "pending",
  },
];

export default function MyProfile() {
  const { isConnected, address } = useWallet();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: "Passionate about blockchain technology and decentralized finance. Building the future of Web3.",
    email: "user@example.com",
    website: "https://juicebox.money",
    twitter: "@JuiceboxETH",
  });

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log("Saving profile:", profileData);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "project_backed":
        return "💰";
      case "nft_staked":
        return "🔒";
      case "rewards_claimed":
        return "🎁";
      case "project_created":
        return "🚀";
      default:
        return "📋";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "active":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111827] flex items-center justify-center pt-20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-[#8A63D2]" />
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access your profile
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111827] pt-20">
      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2 flex items-center">
                My Profile
                <Badge className="ml-3 bg-blue-500 text-white">Beta</Badge>
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Customize your public facing profile and other details.
              </p>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className={!isEditing ? "bg-[#8A63D2] hover:bg-[#7651c0]" : ""}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Profile details</CardTitle>
                <CardDescription>
                  Customize your public facing profile and other details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="space-y-2">
                  <Label className="flex items-center text-base font-medium">
                    Avatar
                    <div className="ml-2 w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-xs text-gray-600 dark:text-gray-300">?</span>
                    </div>
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="/api/placeholder/80/80" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-orange-400 text-white text-xl">
                        {address?.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        Change Avatar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-base font-medium">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      className="min-h-[100px] bg-gray-800 border-gray-700 text-white"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md border">
                      <p className="text-gray-700 dark:text-gray-300">{profileData.bio}</p>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">Email address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  ) : (
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md border">
                      <p className="text-gray-700 dark:text-gray-300">{profileData.email}</p>
                    </div>
                  )}
                </div>

                {/* Socials Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Socials</h3>
                  
                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-base font-medium">Website</Label>
                    {isEditing ? (
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="https://juicebox.money"
                      />
                    ) : (
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md border">
                        <p className="text-gray-700 dark:text-gray-300">{profileData.website}</p>
                      </div>
                    )}
                  </div>

                  {/* Twitter */}
                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="text-base font-medium">Twitter</Label>
                    {isEditing ? (
                      <Input
                        id="twitter"
                        value={profileData.twitter}
                        onChange={(e) => setProfileData({ ...profileData, twitter: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="@JuiceboxETH"
                      />
                    ) : (
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md border">
                        <p className="text-gray-700 dark:text-gray-300">{profileData.twitter}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className="pt-4">
                    <Button 
                      onClick={handleSave}
                      className="bg-[#8A63D2] hover:bg-[#7651c0]"
                    >
                      Save profile details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest actions on the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="text-lg">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.amount}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{activity.date}</span>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(activity.status)}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white dark:bg-[#1a1e31] border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#8A63D2]">12</p>
                    <p className="text-xs text-gray-500">Projects Backed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">4</p>
                    <p className="text-xs text-gray-500">NFTs Owned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">2.5</p>
                    <p className="text-xs text-gray-500">ETH Earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">156</p>
                    <p className="text-xs text-gray-500">Days Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}