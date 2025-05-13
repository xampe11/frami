import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { ChevronRight, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-mobile";

// Documentation content
import { docSections } from "@/lib/docs-content";

// TypeScript interfaces for documentation content
interface DocContentBase {
  type: string;
  title?: string;
  text?: string;
  items?: string[];
  code?: string;
  language?: string;
  headers?: string[];
  rows?: string[][];
}

interface DocContentHeading extends DocContentBase {
  type: 'heading';
  title: string;
}

interface DocContentSubheading extends DocContentBase {
  type: 'subheading';
  title: string;
}

interface DocContentList extends DocContentBase {
  type: 'list';
  items: string[];
}

interface DocContentNumberedList extends DocContentBase {
  type: 'numbered-list';
  items: string[];
}

interface DocContentCode extends DocContentBase {
  type: 'code';
  code: string;
  language?: string;
}

interface DocContentNote extends DocContentBase {
  type: 'note';
  title: string;
  text: string;
}

interface DocContentWarning extends DocContentBase {
  type: 'warning';
  title: string;
  text: string;
}

interface DocContentTable extends DocContentBase {
  type: 'table';
  headers: string[];
  rows: string[][];
}

type DocContent = string | DocContentHeading | DocContentSubheading | DocContentList | 
                 DocContentNumberedList | DocContentCode | DocContentNote | 
                 DocContentWarning | DocContentTable;

interface DocItem {
  id: string;
  title: string;
  description?: string;
  content: DocContent[];
}

interface DocSection {
  id: string;
  title: string;
  items: DocItem[];
}

export default function DocsPage() {
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("start-here");
  const [activeDoc, setActiveDoc] = useState(docSections[0].items[0].id);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Set page title
  useEffect(() => {
    document.title = "Documentation | Frami Platform";
  }, []);

  // Handle sidebar toggle on mobile
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Toggle section collapse
  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Get the current active document content
  const getActiveDocContent = () => {
    let content: DocItem | null = null;
    
    docSections.forEach((section: DocSection) => {
      section.items.forEach((item: DocItem) => {
        if (item.id === activeDoc) {
          content = item;
        }
      });
    });
    
    return content;
  };

  // Set the active document and scroll to top
  const setActiveDocument = (docId: string) => {
    setActiveDoc(docId);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Filter sections based on search query
  const filteredSections = searchQuery.trim() === "" 
    ? docSections 
    : docSections.map((section: DocSection) => ({
        ...section,
        items: section.items.filter((item: DocItem) => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content.some((c: DocContent) => 
            typeof c === 'string' 
              ? c.toLowerCase().includes(searchQuery.toLowerCase())
              : c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.text?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
      })).filter((section: DocSection) => section.items.length > 0);

  const activeContent = getActiveDocContent();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground dark:bg-slate-900">
      <div className="container mx-auto px-4 pt-24 pb-8 flex-grow flex flex-col">
        <div className="flex items-center mb-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={toggleSidebar}
            className="mr-2 md:hidden dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          
          <h1 className="text-2xl md:text-3xl font-bold">
            Platform Documentation
          </h1>
        </div>
        
        <div className="flex flex-1 rounded-lg border dark:border-slate-700/50 overflow-hidden shadow-sm">
          {/* Sidebar */}
          <div 
            className={`${
              sidebarOpen ? 'flex' : 'hidden'
            } w-full md:w-72 lg:w-80 shrink-0 border-r bg-muted/50 dark:bg-slate-800/20 flex-col z-20 absolute md:relative inset-0 md:inset-auto h-[calc(100vh-10rem)] md:h-auto`}
          >
            <div className="p-4 border-b dark:border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search documentation..."
                  className="pl-8 bg-background dark:bg-slate-800/50 dark:border-slate-700/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {filteredSections.map((section: DocSection) => (
                  <div key={section.id} className="space-y-2">
                    <button 
                      onClick={() => toggleSectionCollapse(section.id)}
                      className="flex items-center justify-between w-full text-left py-1 px-1 hover:bg-muted/40 rounded"
                    >
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        {section.title}
                      </h3>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${collapsedSections[section.id] ? '' : 'rotate-90'}`} />
                    </button>
                    {!collapsedSections[section.id] && (
                      <ul className="space-y-1 pl-1 border-l-2 border-muted">
                        {section.items.map((item: DocItem) => (
                          <li key={item.id}>
                            <button
                              onClick={() => setActiveDocument(item.id)}
                              className={`text-sm w-full text-left px-2 py-1.5 rounded-md hover:bg-muted flex items-center transition-colors ${
                                activeDoc === item.id
                                  ? "bg-primary text-primary-foreground hover:bg-primary"
                                  : ""
                              }`}
                            >
                              {activeDoc === item.id && (
                                <ChevronRight className="mr-1 h-4 w-4" />
                              )}
                              <span className={activeDoc === item.id ? "ml-1" : "ml-5"}>
                                {item.title}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto dark:bg-slate-900" ref={mainContentRef}>
            {activeContent ? (
              <div className="p-6 md:p-8 prose prose-slate max-w-full dark:prose-invert">
                <div className="mb-8">
                  <h1 className="font-bold text-2xl sm:text-3xl dark:text-white">{activeContent.title}</h1>
                  {activeContent.description && (
                    <p className="text-muted-foreground text-lg mt-2">{activeContent.description}</p>
                  )}
                </div>
                
                {activeContent.content.map((content: DocContent, idx: number) => {
                  if (typeof content === 'string') {
                    return <p key={idx} className="my-4">{content}</p>;
                  } else if (content.type === 'heading') {
                    return <h2 key={idx} className="text-xl font-semibold mt-8 mb-4">{content.title}</h2>;
                  } else if (content.type === 'subheading') {
                    return <h3 key={idx} className="text-lg font-semibold mt-6 mb-3">{content.title}</h3>;
                  } else if (content.type === 'list') {
                    return (
                      <ul key={idx} className="list-disc ml-6 my-4 space-y-2">
                        {content.items?.map((item: string, itemIdx: number) => (
                          <li key={itemIdx}>{item}</li>
                        ))}
                      </ul>
                    );
                  } else if (content.type === 'numbered-list') {
                    return (
                      <ol key={idx} className="list-decimal ml-6 my-4 space-y-2">
                        {content.items?.map((item: string, itemIdx: number) => (
                          <li key={itemIdx}>{item}</li>
                        ))}
                      </ol>
                    );
                  } else if (content.type === 'code') {
                    return (
                      <div key={idx} className="my-4 bg-slate-900 dark:bg-[#1e1e2e] text-white rounded-md overflow-auto border border-slate-700/50">
                        <pre className="p-4 overflow-x-auto text-sm font-mono"><code>{content.code}</code></pre>
                      </div>
                    );
                  } else if (content.type === 'note') {
                    return (
                      <div key={idx} className="my-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                        <p className="font-medium text-blue-800 dark:text-blue-300">{content.title}</p>
                        <p className="mt-2 text-blue-700 dark:text-blue-200">{content.text}</p>
                      </div>
                    );
                  } else if (content.type === 'warning') {
                    return (
                      <div key={idx} className="my-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded">
                        <p className="font-medium text-amber-800 dark:text-amber-300">{content.title}</p>
                        <p className="mt-2 text-amber-700 dark:text-amber-200">{content.text}</p>
                      </div>
                    );
                  } else if (content.type === 'table') {
                    return (
                      <div key={idx} className="my-4 overflow-x-auto">
                        <table className="min-w-full border dark:border-slate-700 rounded-md">
                          <thead className="bg-slate-100 dark:bg-slate-800">
                            <tr>
                              {content.headers?.map((header: string, headerIdx: number) => (
                                <th key={headerIdx} className="border dark:border-slate-700 px-4 py-2 text-left">{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {content.rows?.map((row: string[], rowIdx: number) => (
                              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'}>
                                {row.map((cell: string, cellIdx: number) => (
                                  <td key={cellIdx} className="border dark:border-slate-700 px-4 py-2">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center h-full">
                <p className="text-muted-foreground">Select a document from the sidebar to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}