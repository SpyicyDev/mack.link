import { useState, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonToast,
  IonButtons,
  IonButton,
  IonActionSheet,
} from '@ionic/react';
import {
  add,
  linkOutline,
  open,
  create,
  trash,
  copy,
  qrCode,
  analyticsOutline,
  ellipsisVertical,
} from 'ionicons/icons';
import { useLinks, useDeleteLink } from '../hooks/useLinks';
import { Link } from '../services/api';
import CreateLinkModal from '../components/CreateLinkModal';
import EditLinkModal from '../components/EditLinkModal';
import { RefresherEventDetail } from '@ionic/react';

const LinksPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const createModalRef = useRef<HTMLIonModalElement>(null);
  const editModalRef = useRef<HTMLIonModalElement>(null);

  const { data: links = {}, isLoading, refetch } = useLinks();
  const deleteLink = useDeleteLink();

  const filteredLinks = Object.entries(links).filter(([shortcode, link]) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      shortcode.toLowerCase().includes(search) ||
      link.url.toLowerCase().includes(search) ||
      (link.title && link.title.toLowerCase().includes(search)) ||
      (link.description && link.description.toLowerCase().includes(search)) ||
      link.tags.some(tag => tag.toLowerCase().includes(search))
    );
  }).sort(([, a], [, b]) => new Date(b.created).getTime() - new Date(a.created).getTime());

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  const handleDeleteLink = async (shortcode: string) => {
    try {
      await deleteLink.mutateAsync(shortcode);
      setShowDeleteToast(true);
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  const handleCopyLink = async (shortcode: string) => {
    const shortUrl = `${window.location.origin}/${shortcode}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      // Show toast or feedback
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const openEditModal = (link: Link) => {
    setEditingLink(link);
    setShowEditModal(true);
  };

  const openLinkActions = (link: Link) => {
    setSelectedLink(link);
    setShowActionSheet(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Links</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowCreateModal(true)}>
              <IonIcon icon={add} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value!)}
          placeholder="Search links..."
          showClearButton="focus"
        />

        <IonList>
          {filteredLinks.map(([shortcode, link]) => (
            <IonItemSliding key={shortcode}>
              <IonItem>
                <IonIcon icon={linkOutline} slot="start" color="primary" />
                <IonLabel>
                  <h2>{link.title || shortcode}</h2>
                  <p>{link.url}</p>
                  <IonNote color="medium">
                    {link.clicks} clicks • Created {formatDate(link.created)}
                  </IonNote>
                </IonLabel>
                <div slot="end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                  {link.tags.length > 0 && (
                    <div style={{ marginBottom: '4px' }}>
                      {link.tags.slice(0, 2).map(tag => (
                        <IonBadge key={tag} color="light" style={{ marginLeft: '4px', fontSize: '0.7rem' }}>
                          {tag}
                        </IonBadge>
                      ))}
                      {link.tags.length > 2 && (
                        <IonBadge color="light" style={{ marginLeft: '4px', fontSize: '0.7rem' }}>
                          +{link.tags.length - 2}
                        </IonBadge>
                      )}
                    </div>
                  )}
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => openLinkActions(link)}
                  >
                    <IonIcon icon={ellipsisVertical} />
                  </IonButton>
                </div>
              </IonItem>

              <IonItemOptions side="end">
                <IonItemOption color="primary" onClick={() => handleCopyLink(shortcode)}>
                  <IonIcon icon={copy} />
                  Copy
                </IonItemOption>
                <IonItemOption onClick={() => openEditModal(link)}>
                  <IonIcon icon={create} />
                  Edit
                </IonItemOption>
                <IonItemOption color="danger" onClick={() => handleDeleteLink(shortcode)}>
                  <IonIcon icon={trash} />
                  Delete
                </IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}
        </IonList>

        {filteredLinks.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ion-color-medium)' }}>
            {searchText ? 'No links match your search.' : 'No links yet. Create your first link!'}
          </div>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowCreateModal(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <CreateLinkModal
          ref={createModalRef}
          isOpen={showCreateModal}
          onDidDismiss={() => setShowCreateModal(false)}
        />

        <EditLinkModal
          ref={editModalRef}
          isOpen={showEditModal}
          link={editingLink}
          onDidDismiss={() => {
            setShowEditModal(false);
            setEditingLink(null);
          }}
        />

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={selectedLink ? [
            {
              text: 'Open Link',
              icon: open,
              handler: () => {
                window.open(selectedLink.url, '_blank');
              }
            },
            {
              text: 'Copy Short URL',
              icon: copy,
              handler: () => {
                handleCopyLink(selectedLink.shortcode);
              }
            },
            {
              text: 'Edit',
              icon: create,
              handler: () => {
                openEditModal(selectedLink);
              }
            },
            {
              text: 'QR Code',
              icon: qrCode,
              handler: () => {
                // TODO: Implement QR code modal
              }
            },
            {
              text: 'Analytics',
              icon: analyticsOutline,
              handler: () => {
                // TODO: Navigate to analytics for specific link
              }
            },
            {
              text: 'Delete',
              icon: trash,
              role: 'destructive',
              handler: () => {
                handleDeleteLink(selectedLink.shortcode);
              }
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ] : []}
        />

        <IonLoading isOpen={isLoading} message="Loading links..." />

        <IonToast
          isOpen={showDeleteToast}
          message="Link deleted successfully"
          duration={2000}
          onDidDismiss={() => setShowDeleteToast(false)}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default LinksPage;