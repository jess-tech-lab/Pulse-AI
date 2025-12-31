import { useState, useMemo } from 'react';
import { ExternalLink, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FeedbackItem } from '@/types';

interface EvidenceLogTabProps {
  items: FeedbackItem[];
}

type SortField = 'createdAt' | 'score' | 'impactScore';
type SortDirection = 'asc' | 'desc';

export function EvidenceLogTab({ items }: EvidenceLogTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          item.classification.summary.keyQuote.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(item => item.classification.type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(item => item.classification.category === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'impactScore':
          aValue = a.classification.problemMetadata?.impactScore || 0;
          bValue = b.classification.problemMetadata?.impactScore || 0;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    return result;
  }, [items, searchQuery, typeFilter, categoryFilter, sortField, sortDirection]);

  const types = ['all', 'Constructive', 'Praise', 'Neutral'];
  const categories = ['all', 'Feature Request', 'Usability Friction', 'Support Question', 'Rant/Opinion', 'N/A'];

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'Constructive': return 'destructive';
      case 'Praise': return 'success';
      case 'Neutral': return 'secondary';
      default: return 'outline';
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search quotes, titles, content..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredItems.length} of {items.length} items
          </div>
        </CardContent>
      </Card>

      {/* Evidence Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Log</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No matching feedback items found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Key Quote</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort('impactScore')}
                  >
                    <div className="flex items-center gap-1">
                      Impact <SortIcon field="impactScore" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort('score')}
                  >
                    <div className="flex items-center gap-1">
                      Score <SortIcon field="score" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Date <SortIcon field="createdAt" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <>
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
                    >
                      <TableCell className="font-medium">
                        <p className="line-clamp-2">"{item.classification.summary.keyQuote}"</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeVariant(item.classification.type)}>
                          {item.classification.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.classification.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.classification.problemMetadata?.impactScore
                          ? `${item.classification.problemMetadata.impactScore}/10`
                          : '-'}
                      </TableCell>
                      <TableCell>{item.score}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={e => {
                            e.stopPropagation();
                            window.open(item.url, '_blank');
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRow === item.id && (
                      <TableRow key={`${item.id}-expanded`}>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <div className="p-4 space-y-4">
                            <div>
                              <h4 className="font-semibold">{item.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                r/{item.subreddit} • by u/{item.author} • {item.numComments} comments
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                  Actionable Insight
                                </p>
                                <p className="text-sm mt-1">
                                  {item.classification.summary.actionableInsight}
                                </p>
                              </div>

                              {item.classification.problemMetadata && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground uppercase">
                                    Problem Metadata
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">
                                      {item.classification.problemMetadata.featureArea}
                                    </Badge>
                                    <Badge variant="outline">
                                      {item.classification.problemMetadata.impactType}
                                    </Badge>
                                    <Badge variant="outline">
                                      {item.classification.problemMetadata.urgencySignal}
                                    </Badge>
                                    <Badge variant="outline">
                                      {item.classification.problemMetadata.effortGuess}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Root Cause: {item.classification.problemMetadata.rootCause}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase">
                                Suggested Reply
                              </p>
                              <p className="text-sm mt-1 italic">
                                "{item.classification.summary.replyDraft}"
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
