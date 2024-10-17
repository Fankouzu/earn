import { Avatar, Flex, Text, Tooltip } from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { OgImageViewer } from '@/components/shared/ogImageViewer';
import { getURL } from '@/utils/validUrl';

import { type FeedDataProps } from '../types';
import { FeedCardContainer } from './FeedCardContainer';
import { FeedCardLink } from './FeedCardLink';
import { WinnerFeedImage } from './WinnerFeedImage';

interface SubCardProps {
  sub: FeedDataProps;
  type: 'profile' | 'activity';
}

export function SubmissionCard({ sub, type }: SubCardProps) {
  const { t } = useTranslation('common');

  const firstName = sub?.firstName;
  const lastName = sub?.lastName;
  const photo = sub?.photo;
  const username = sub?.username;

  const isProject = sub?.listingType === 'project';

  const listingLink = `${getURL()}listings/${sub?.listingType}/${sub?.listingSlug}`;

  const submissionLink = `${listingLink}/submission/${sub?.id}`;

  const link = sub?.isWinnersAnnounced
    ? isProject
      ? listingLink
      : submissionLink
    : listingLink;

  let winningText: string = '';
  let submissionText: string = '';

  switch (sub?.listingType) {
    case 'bounty':
      winningText = t('submissionCard.wonBounty');
      submissionText = t('submissionCard.submittedToBounty');
      break;
    case 'hackathon':
      winningText = t('submissionCard.wonHackathonTrack');
      submissionText = t('submissionCard.submittedToHackathon');
      break;
    case 'project':
      winningText = t('submissionCard.selectedForProject');
      submissionText = t('submissionCard.appliedToProject');
      break;
  }

  const content = {
    actionText:
      sub?.isWinner && sub?.isWinnersAnnounced ? winningText : submissionText,
    createdAt: sub?.createdAt,
  };

  const actionLinks = (
    <>
      <Flex align={'center'} gap={3}>
        <Avatar size={'xs'} src={sub?.sponsorLogo} />
        <Text
          as={NextLink}
          overflow={'hidden'}
          color={'brand.slate.500'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
          _hover={{ textDecoration: 'underline' }}
          textOverflow={'ellipsis'}
          href={listingLink}
          noOfLines={1}
          rel="noopener noreferrer"
          target="_blank"
        >
          {sub?.listingTitle}
        </Text>
      </Flex>
      <Tooltip
        px={4}
        py={2}
        color="brand.slate.500"
        fontFamily={'var(--font-sans)'}
        bg="white"
        borderRadius={'lg'}
        isDisabled={!!sub?.id || isProject}
        label={t('submissionCard.submissionAccessInfo')}
        shouldWrapChildren
      >
        <FeedCardLink
          href={link}
          style={{
            opacity: sub?.id || isProject ? '100%' : '50%',
            pointerEvents: sub?.id || isProject ? 'all' : 'none',
          }}
        >
          {isProject
            ? t('submissionCard.viewListing')
            : t('submissionCard.viewSubmission')}
        </FeedCardLink>
      </Tooltip>
    </>
  );

  return (
    <FeedCardContainer
      content={content}
      actionLinks={actionLinks}
      type={type}
      firstName={firstName}
      lastName={lastName}
      photo={photo}
      username={username}
      id={sub?.id}
      like={sub?.like}
      commentLink={link}
      cardType="submission"
      link={link}
      userId={sub?.userId}
    >
      {sub?.isWinner && sub?.isWinnersAnnounced ? (
        <WinnerFeedImage
          token={sub?.token}
          rewards={sub?.rewards}
          winnerPosition={sub?.winnerPosition}
        />
      ) : (
        <OgImageViewer
          externalUrl={sub?.link ?? ''}
          w="full"
          h={{ base: '200px', md: '350px' }}
          objectFit="cover"
          borderTopRadius={6}
          imageUrl={sub?.ogImage}
          type="submission"
          id={sub?.id}
        />
      )}
    </FeedCardContainer>
  );
}
