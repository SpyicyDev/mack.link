import { useState, useEffect, forwardRef } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonToggle,
  IonDatetime,
  IonLoading,
  IonToast,
} from '@ionic/react';
import { close, save } from 'ionicons/icons';
import { useUpdateLink } from '../hooks/useLinks';
import { Link, CreateLinkData } from '../services/api';

interface EditLinkModalProps {
  isOpen: boolean;
  link: Link | null;
  onDidDismiss: () => void;
}

const EditLinkModal = forwardRef<HTMLIonModalElement, EditLinkModalProps>(
  ({ isOpen, link, onDidDismiss }, ref) => {
    const [formData, setFormData] = useState<Partial<CreateLinkData>>({});
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [tagsInput, setTagsInput] = useState('');

    const updateLink = useUpdateLink();

    useEffect(() => {
      if (link) {
        setFormData({
          url: link.url,
          title: link.title || '',
          description: link.description || '',
          password: '', // Don't pre-fill password for security
          activatesAt: link.activatesAt || '',
          expiresAt: link.expiresAt || '',
          redirectType: link.redirectType || 301,
        });
        setTagsInput(link.tags.join(', '));
        setShowAdvanced(link.passwordEnabled || !!link.activatesAt || !!link.expiresAt);
      }
    }, [link]);

    const resetForm = () => {
      setFormData({});
      setTagsInput('');
      setShowAdvanced(false);
    };

    const handleSubmit = async () => {
      if (!link) return;

      // Validation
      if (!formData.url) {
        setToastMessage('URL is required');
        setShowToast(true);
        return;
      }

      try {
        const dataToSubmit = {
          ...formData,
          tags: tagsInput.split(',').map(tag => tag.trim()).filter(Boolean),
        };

        await updateLink.mutateAsync({
          shortcode: link.shortcode,
          data: dataToSubmit,
        });
        resetForm();
        onDidDismiss();
      } catch (error: any) {
        setToastMessage(error.message || 'Failed to update link');
        setShowToast(true);
      }
    };

    const handleDismiss = () => {
      resetForm();
      onDidDismiss();
    };

    if (!link) return null;

    return (
      <IonModal ref={ref} isOpen={isOpen} onDidDismiss={handleDismiss}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Edit Link: {link.shortcode}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleDismiss}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <IonList>
            <IonItem>
              <IonLabel position="stacked">Destination URL *</IonLabel>
              <IonInput
                value={formData.url}
                onIonInput={(e) => setFormData({ ...formData, url: e.detail.value! })}
                placeholder="https://example.com"
                type="url"
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Title (optional)</IonLabel>
              <IonInput
                value={formData.title}
                onIonInput={(e) => setFormData({ ...formData, title: e.detail.value! })}
                placeholder="My awesome link"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Description (optional)</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonInput={(e) => setFormData({ ...formData, description: e.detail.value! })}
                placeholder="Brief description of this link"
                rows={3}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Tags (comma separated)</IonLabel>
              <IonInput
                value={tagsInput}
                onIonInput={(e) => setTagsInput(e.detail.value!)}
                placeholder="work, important, project"
              />
            </IonItem>

            <IonItem>
              <IonLabel>Advanced Options</IonLabel>
              <IonToggle
                checked={showAdvanced}
                onIonChange={(e) => setShowAdvanced(e.detail.checked)}
                slot="end"
              />
            </IonItem>

            {showAdvanced && (
              <>
                <IonItem>
                  <IonLabel position="stacked">Password Protection (optional)</IonLabel>
                  <IonInput
                    value={formData.password}
                    onIonInput={(e) => setFormData({ ...formData, password: e.detail.value! })}
                    placeholder={link.passwordEnabled ? "Enter new password" : "Enter password"}
                    type="password"
                    helperText={link.passwordEnabled ? "Leave empty to keep current password" : ""}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Redirect Type</IonLabel>
                  <IonSelect
                    value={formData.redirectType}
                    onSelectionChange={(e) => setFormData({ ...formData, redirectType: e.detail.value as number })}
                  >
                    <IonSelectOption value={301}>301 - Permanent</IonSelectOption>
                    <IonSelectOption value={302}>302 - Temporary</IonSelectOption>
                    <IonSelectOption value={307}>307 - Temporary (preserve method)</IonSelectOption>
                    <IonSelectOption value={308}>308 - Permanent (preserve method)</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Activation Date (optional)</IonLabel>
                  <IonDatetime
                    value={formData.activatesAt}
                    onIonChange={(e) => setFormData({ ...formData, activatesAt: e.detail.value as string })}
                    presentation="date"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Expiration Date (optional)</IonLabel>
                  <IonDatetime
                    value={formData.expiresAt}
                    onIonChange={(e) => setFormData({ ...formData, expiresAt: e.detail.value as string })}
                    presentation="date"
                  />
                </IonItem>
              </>
            )}
          </IonList>

          <div className="ion-padding">
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={updateLink.isPending || !formData.url}
            >
              <IonIcon icon={save} slot="start" />
              {updateLink.isPending ? 'Updating...' : 'Update Link'}
            </IonButton>
          </div>
        </IonContent>

        <IonLoading
          isOpen={updateLink.isPending}
          message="Updating link..."
        />

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
          color="danger"
        />
      </IonModal>
    );
  }
);

export default EditLinkModal;