import { Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AiOutlineInfoCircle } from 'react-icons/ai';

export function EmptySection({
  title,
  message,
  showNotifSub = true,
}: {
  title?: string;
  message?: string;
  showNotifSub?: boolean;
}) {
  const { t } = useTranslation('common');

  return (
    <Flex align={'center'} justify="center" w="full">
      <Flex align={'center'} justify="center" direction={'column'}>
        <AiOutlineInfoCircle fontSize={52} color="#94a3b8" />
        <Text mt={2} color="brand.slate.400" fontSize="lg" fontWeight={700}>
          {title || t('emptySection.defaultTitle')}
        </Text>
        {showNotifSub && (
          <Text mt={2} color="brand.slate.300">
            {message || t('emptySection.defaultMessage')}
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
