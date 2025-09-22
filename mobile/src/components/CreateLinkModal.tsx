import { useState, forwardRef } from 'react';
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
import { useCreateLink } from '../hooks/useLinks';
import { useReservedPaths, isShortcodeReserved } from '../hooks/useReservedPaths';
import { CreateLinkData } from '../services/api';

interface CreateLinkModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const CreateLinkModal = forwardRef<HTMLIonModalElement, CreateLinkModalProps>(
  ({ isOpen, onDidDismiss }, ref) => {
    const [formData, setFormData] = useState<CreateLinkData>({
      url: '',
      shortcode: '',
      title: '',
      description: '',
      tags: [],
      password: '',
      activatesAt: '',
      expiresAt: '',
      redirectType: 301,
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [tagsInput, setTagsInput] = useState('');

    const createLink = useCreateLink();
    const { data: reservedPaths = [] } = useReservedPaths();

    const resetForm = () => {
      setFormData({
        url: '',
        shortcode: '',
        title: '',
        description: '',
        tags: [],
        password: '',
        activatesAt: '',
        expiresAt: '',
        redirectType: 301,
      });
      setTagsInput('');
      setShowAdvanced(false);
    };

    const handleSubmit = async () => {
      // Validation
      if (!formData.url) {
        setToastMessage('URL is required');
        setShowToast(true);
        return;
      }

      if (formData.shortcode && isShortcodeReserved(formData.shortcode, reservedPaths)) {
        setToastMessage(`"${formData.shortcode}" is reserved and cannot be used`);
        setShowToast(true);
        return;
      }

      try {
        const dataToSubmit = {
          ...formData,
          tags: tagsInput.split(',').map(tag => tag.trim()).filter(Boolean),
        };

        await createLink.mutateAsync(dataToSubmit);
        resetForm();
        onDidDismiss();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create link';
        setToastMessage(errorMessage);
        setShowToast(true);
      }
    };

    const handleDismiss = () => {
      resetForm();
      onDidDismiss();
    };

    return (
      <IonModal ref={ref} isOpen={isOpen} onDidDismiss={handleDismiss}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Create New Link</IonTitle>
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
              <IonLabel position="stacked">Custom Shortcode (optional)</IonLabel>
              <IonInput
                value={formData.shortcode}
                onIonInput={(e) => setFormData({ ...formData, shortcode: e.detail.value! })}
                placeholder="my-link"
                helperText="Leave empty for auto-generated shortcode"
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
                    placeholder="Enter password"
                    type="password"
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
              disabled={createLink.isPending || !formData.url}
            >
              <IonIcon icon={save} slot="start" />
              {createLink.isPending ? 'Creating...' : 'Create Link'}
            </IonButton>
          </div>
        </IonContent>

        <IonLoading
          isOpen={createLink.isPending}
          message="Creating link..."
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

export default CreateLinkModal;