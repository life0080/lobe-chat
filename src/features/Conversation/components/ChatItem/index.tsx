import { type AlertProps, ChatItem } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import { ReactNode, memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';
import { useSessionStore } from '@/store/session';
import { agentSelectors } from '@/store/session/selectors';
import { ChatMessage } from '@/types/message';

import { renderErrorMessages } from '../../Error';
import { renderMessagesExtra } from '../../Extras';
import { renderMessages, useAvatarsClick } from '../../Messages';
import ActionsBar from './ActionsBar';

export interface ChatListItemProps {
  index: number;
}
const avatarData = {
  avatar: './Bluebee Girl.png',
  backgroundColor: '#ffffff',
  title: 'BlueBeeGirl',
};
const Item = memo<ChatListItemProps>(({ index }) => {
  const { t } = useTranslation('common');

  const [editing, setEditing] = useState(false);
  const [type = 'chat'] = useSessionStore((s) => {
    const config = agentSelectors.currentAgentConfig(s);
    return [config.displayMode];
  });

  const meta = useSessionStore(agentSelectors.currentAgentMeta, isEqual);
  const item = useChatStore(
    (s) => chatSelectors.currentChatsWithGuideMessage(meta)(s)[index],
    isEqual,
  );

  const [loading, onMessageChange] = useChatStore((s) => [
    s.chatLoadingId === item.id,
    s.updateMessageContent,
  ]);

  const onAvatarsClick = useAvatarsClick();

  const RenderMessage = useCallback(
    ({ editableContent, data }: { data: ChatMessage; editableContent: ReactNode }) => {
      if (!item?.role) return;
      const RenderFunction = renderMessages[item.role] ?? renderMessages['default'];

      if (!RenderFunction) return;

      return <RenderFunction {...data} editableContent={editableContent} />;
    },
    [item.role],
  );

  const MessageExtra = useCallback(
    ({ data }: { data: ChatMessage }) => {
      if (!renderMessagesExtra || !item?.role) return;
      let RenderFunction;
      if (renderMessagesExtra?.[item.role]) RenderFunction = renderMessagesExtra[item.role];

      if (!RenderFunction) return;
      return <RenderFunction {...data} />;
    },
    [item.role],
  );

  const ErrorMessage = useCallback(
    ({ data }: { data: ChatMessage }) => {
      if (!renderErrorMessages || !item?.error?.type) return;
      let RenderFunction;
      if (renderErrorMessages?.[item.error.type])
        RenderFunction = renderErrorMessages[item.error.type].Render;
      if (!RenderFunction && renderErrorMessages?.['default'])
        RenderFunction = renderErrorMessages['default'].Render;
      if (!RenderFunction) return;
      return <RenderFunction {...data} />;
    },
    [item.error],
  );

  const error = useMemo(() => {
    if (!item.error) return;
    const message = item.error?.message;
    let alertConfig = {};
    if (item.error.type && renderErrorMessages?.[item.error.type]) {
      alertConfig = renderErrorMessages[item.error.type]?.config as AlertProps;
    }
    return { message, ...alertConfig };
  }, [item.error]);

  return (
    <ChatItem
      actions={<ActionsBar index={index} setEditing={setEditing} />}
      avatar={avatarData}
      editing={editing}
      error={error}
      errorMessage={<ErrorMessage data={item} />}
      loading={loading}
      message={item.content}
      messageExtra={<MessageExtra data={item} />}
      onAvatarClick={onAvatarsClick?.(item.role)}
      onChange={(value) => onMessageChange(item.id, value)}
      onDoubleClick={(e) => {
        if (item.id === 'default' || item.error) return;
        if (item.role && ['assistant', 'user'].includes(item.role) && e.altKey) {
          setEditing(true);
        }
      }}
      onEditingChange={setEditing}
      placement={type === 'chat' ? (item.role === 'user' ? 'right' : 'left') : 'left'}
      primary={item.role === 'user'}
      renderMessage={(editableContent) => (
        <RenderMessage data={item} editableContent={editableContent} />
      )}
      text={{
        cancel: t('cancel'),
        confirm: t('ok'),
        edit: t('edit'),
      }}
      time={item.updatedAt || item.createdAt}
      type={type === 'chat' ? 'block' : 'pure'}
    />
  );
});

export default Item;
