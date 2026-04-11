import React, { useCallback, useContext, useEffect, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import AuthorOperatorChat from './AuthorOperatorChat';
import { useMediaMinWidth } from '../hooks/useMediaMinWidth';

/** Layout asosiy kontentga o‘ng chekka — chat paneli kengligi */
export const ARTICLE_CHAT_DOCK_WIDTH_PX = 300;

export const MainRightInsetContext = React.createContext<React.Dispatch<React.SetStateAction<number>> | null>(null);

/**
 * Maqola sahifasida (lg+) o‘ng tomonda doimiy ochiq operator/muallif chati.
 */
const ArticleChatDock: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const setMainRightInset = useContext(MainRightInsetContext);
  const isLg = useMediaMinWidth(1024);

  const match = matchPath({ path: '/articles/:id', end: true }, location.pathname);
  const articleId = match?.params?.id;

  const [authorId, setAuthorId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string | undefined>(undefined);
  const [metaLoading, setMetaLoading] = useState(false);

  const loadMeta = useCallback(async () => {
    if (!articleId || !user) {
      setAuthorId(null);
      setAuthorName(undefined);
      return;
    }
    setMetaLoading(true);
    try {
      const res = await apiService.articles.get(articleId);
      const data = (res as { data?: Record<string, unknown> }).data ?? res;
      const a = data as { author?: string; author_name?: string };
      setAuthorId(a.author != null ? String(a.author) : null);
      setAuthorName(typeof a.author_name === 'string' ? a.author_name : undefined);
    } catch {
      setAuthorId(null);
      setAuthorName(undefined);
    } finally {
      setMetaLoading(false);
    }
  }, [articleId, user]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const roleNorm = typeof user?.role === 'string' ? user.role.toLowerCase() : String(user?.role ?? '');

  const viewerIsAuthor =
    roleNorm === 'author' && user != null && authorId != null && String(user.id) === String(authorId);

  const showDock =
    isLg &&
    !metaLoading &&
    !!articleId &&
    !!user &&
    (roleNorm === 'operator' ||
      roleNorm === 'super_admin' ||
      (roleNorm === 'author' && authorId != null && String(user.id) === String(authorId)));

  useEffect(() => {
    if (!setMainRightInset) return;
    if (showDock) {
      setMainRightInset(ARTICLE_CHAT_DOCK_WIDTH_PX);
    } else {
      setMainRightInset(0);
    }
    return () => {
      setMainRightInset(0);
    };
  }, [showDock, setMainRightInset]);

  if (!showDock) {
    return null;
  }

  return (
    <aside
      className="hidden lg:flex flex-col fixed right-0 z-[35] w-[300px] border-l border-white/10 bg-gray-950/95 backdrop-blur-md shadow-[-8px_0_32px_rgba(0,0,0,0.35)] top-[7.25rem] bottom-0"
      aria-label="Maqola chat paneli"
    >
      <AuthorOperatorChat
        articleId={articleId!}
        viewerIsAuthor={viewerIsAuthor}
        authorDisplayName={authorName}
        variant="dock"
      />
    </aside>
  );
};

export default ArticleChatDock;
