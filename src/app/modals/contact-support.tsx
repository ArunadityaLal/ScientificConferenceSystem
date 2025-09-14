'use client';

import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Building } from 'lucide-react';

export default function ContactSupportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader>Contact Support</ModalHeader>
      <ModalBody>
        <div className="flex flex-col items-start gap-4 text-gray-700">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">Conference Organizing Team</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-600" />
            <span>support@conference.com</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-yellow-600" />
            <span>+91 98765 43210</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          For immediate assistance, please use the contact details above.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
}
