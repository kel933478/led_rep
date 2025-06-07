import { useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Play, BookOpen, Shield, TrendingUp, Clock, Star } from "lucide-react";

export default function Academy() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const courses = [
    {
      id: 1,
      title: "Blockchain Fundamentals",
      description: "Learn the basics of blockchain technology and how it powers cryptocurrencies",
      duration: "2 hours",
      level: "Beginner",
      rating: 4.8,
      enrolled: 1250,
      type: "course",
      thumbnail: "🔗"
    },
    {
      id: 2,
      title: "Cryptocurrency Security",
      description: "Best practices for securing your digital assets and avoiding common pitfalls",
      duration: "1.5 hours",
      level: "Intermediate",
      rating: 4.9,
      enrolled: 890,
      type: "course",
      thumbnail: "🔒"
    },
    {
      id: 3,
      title: "DeFi Explained",
      description: "Understanding decentralized finance and its applications",
      duration: "3 hours",
      level: "Advanced",
      rating: 4.7,
      enrolled: 567,
      type: "course",
      thumbnail: "🏦"
    },
    {
      id: 4,
      title: "Portfolio Management",
      description: "Strategies for building and managing a balanced crypto portfolio",
      duration: "45 min",
      level: "Intermediate",
      rating: 4.6,
      enrolled: 2100,
      type: "course",
      thumbnail: "📊"
    }
  ];

  const articles = [
    {
      id: 1,
      title: "What is Bitcoin?",
      description: "A comprehensive guide to understanding Bitcoin and its role in the financial system",
      readTime: "8 min read",
      category: "Basics",
      date: "Dec 5, 2024",
      author: "Ledger Team"
    },
    {
      id: 2,
      title: "Understanding Smart Contracts",
      description: "How smart contracts work and their applications in blockchain technology",
      readTime: "12 min read",
      category: "Technology",
      date: "Dec 3, 2024",
      author: "Sarah Mitchell"
    },
    {
      id: 3,
      title: "Tax Implications of Crypto Trading",
      description: "Navigate the complex world of cryptocurrency taxation",
      readTime: "15 min read",
      category: "Legal",
      date: "Nov 28, 2024",
      author: "Legal Team"
    },
    {
      id: 4,
      title: "Cold Storage vs Hot Wallets",
      description: "Understanding different wallet types and their security implications",
      readTime: "10 min read",
      category: "Security",
      date: "Nov 25, 2024",
      author: "Security Team"
    }
  ];

  const videos = [
    {
      id: 1,
      title: "Setting Up Your First Wallet",
      description: "Step-by-step tutorial on creating and securing your cryptocurrency wallet",
      duration: "12:34",
      views: "45K views",
      thumbnail: "👛",
      category: "Tutorial"
    },
    {
      id: 2,
      title: "Market Analysis Techniques",
      description: "Learn how to analyze cryptocurrency markets and make informed decisions",
      duration: "28:17",
      views: "23K views",
      thumbnail: "📈",
      category: "Trading"
    },
    {
      id: 3,
      title: "Understanding Yield Farming",
      description: "Explore DeFi yield farming strategies and risk management",
      duration: "18:45",
      views: "31K views",
      thumbnail: "🌾",
      category: "DeFi"
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-600';
      case 'Intermediate': return 'bg-yellow-600';
      case 'Advanced': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Basics': return 'bg-blue-600';
      case 'Technology': return 'bg-purple-600';
      case 'Legal': return 'bg-orange-600';
      case 'Security': return 'bg-red-600';
      case 'Tutorial': return 'bg-green-600';
      case 'Trading': return 'bg-yellow-600';
      case 'DeFi': return 'bg-pink-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{t('ledgerAcademy')}</h1>
              <p className="text-gray-400 mt-1">{t('academyDescription')}</p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search courses, articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Featured Banner */}
        <Card className="bg-gradient-to-r from-blue-900 to-purple-900 border-none">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <Badge className="bg-yellow-500 text-black font-medium">Featured</Badge>
                <h2 className="text-2xl font-bold text-white">Cryptocurrency Masterclass</h2>
                <p className="text-gray-200 max-w-lg">
                  Complete guide to understanding, investing, and securing your digital assets. 
                  Perfect for beginners and intermediate users.
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-1" />6 hours</span>
                  <span className="flex items-center"><Star className="w-4 h-4 mr-1" />4.9 rating</span>
                  <span>3,500+ enrolled</span>
                </div>
                <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                  <Play className="w-4 h-4 mr-2" />
                  Start Learning
                </Button>
              </div>
              <div className="text-8xl">🎓</div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Courses</span>
            </TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-4xl mb-2">{course.thumbnail}</div>
                      <Badge className={`${getLevelColor(course.level)} text-white`}>
                        {course.level}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-lg">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-400 text-sm">{course.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {course.duration}
                      </span>
                      <span className="flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        {course.rating}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {course.enrolled.toLocaleString()} students enrolled
                    </div>
                    
                    <Button className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Start Course
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <div className="space-y-4">
              {articles.map((article) => (
                <Card key={article.id} className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getCategoryColor(article.category)} text-white text-xs`}>
                            {article.category}
                          </Badge>
                          <span className="text-xs text-gray-500">{article.date}</span>
                          <span className="text-xs text-gray-500">by {article.author}</span>
                        </div>
                        <h3 className="text-white text-xl font-semibold">{article.title}</h3>
                        <p className="text-gray-400">{article.description}</p>
                        <span className="text-sm text-gray-500">{article.readTime}</span>
                      </div>
                      <div className="text-3xl ml-4">📄</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="relative">
                      <div className="text-6xl text-center py-8 bg-gray-800 rounded-lg">
                        {video.thumbnail}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                      <Button 
                        size="sm" 
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-black hover:bg-gray-200"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge className={`${getCategoryColor(video.category)} text-white text-xs`}>
                      {video.category}
                    </Badge>
                    <h3 className="text-white font-semibold">{video.title}</h3>
                    <p className="text-gray-400 text-sm">{video.description}</p>
                    <p className="text-xs text-gray-500">{video.views}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Ledger Academy Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Earn Your Certification</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Complete courses and assessments to earn official Ledger Academy certifications. 
                    Showcase your blockchain and cryptocurrency knowledge.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="text-2xl mb-2">🥉</div>
                      <h4 className="text-white font-medium">Crypto Basics</h4>
                      <p className="text-sm text-gray-400">Foundation knowledge</p>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="text-2xl mb-2">🥈</div>
                      <h4 className="text-white font-medium">Advanced Trading</h4>
                      <p className="text-sm text-gray-400">Professional level</p>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="text-2xl mb-2">🥇</div>
                      <h4 className="text-white font-medium">Blockchain Expert</h4>
                      <p className="text-sm text-gray-400">Master certification</p>
                    </div>
                  </div>
                  
                  <Button size="lg" className="mt-6">
                    <Shield className="w-4 h-4 mr-2" />
                    Start Certification Path
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}