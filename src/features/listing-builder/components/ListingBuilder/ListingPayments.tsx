import {
  AddIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DeleteIcon,
  SearchIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { t } from 'i18next';
import { produce } from 'immer';
import debounce from 'lodash.debounce';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuEye } from 'react-icons/lu';

import {
  BONUS_REWARD_POSITION,
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
  tokenList,
} from '@/constants';
import { type Rewards } from '@/features/listings';
import {
  cleanRewardPrizes,
  cleanRewards,
  getRankLabels,
  sortRank,
} from '@/utils/rank';

import { useListingFormStore } from '../../store';
import { type ListingFormType } from '../../types';
import {
  caculateBonus,
  calculateTotalOfArray,
  formatTotalPrice,
} from '../../utils';
import { ListingFormLabel, ListingTooltip } from './Form';

interface Token {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  icon: string;
  decimals: number;
  coingeckoSymbol: string;
}

interface PrizeListInterface {
  value: number;
  label: string;
  placeHolder: number;
  defaultValue?: number;
}
interface Props {
  isDraftLoading: boolean;
  createDraft: (data: ListingFormType, isPreview?: boolean) => Promise<void>;
  createAndPublishListing: (closeConfirm: () => void) => void;
  isListingPublishing: boolean;
  editable: boolean;
  isNewOrDraft?: boolean;
  type: 'bounty' | 'project' | 'hackathon';
  isDuplicating?: boolean;
}

const BONUS_REWARD_LABEL = t('listingPayments.bonusRewardLabel');
const BONUS_REWARD_LABEL_2 = t('listingPayments.bonusRewardLabel2');

export const ListingPayments = ({
  isListingPublishing,
  createDraft,
  isDraftLoading,
  createAndPublishListing,
  editable,
  isNewOrDraft,
  type,
  isDuplicating,
}: Props) => {
  const { form, updateState } = useListingFormStore();
  const {
    isOpen: confirmIsOpen,
    onOpen: confirmOnOpen,
    onClose: confirmOnClose,
  } = useDisclosure();

  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(
    tokenList.find((t) => t.tokenSymbol === form?.token),
  );

  const { register, setValue, watch, control, handleSubmit, reset, getValues } =
    useForm({
      defaultValues: {
        compensationType: form?.compensationType,
        rewardAmount: form?.rewardAmount,
        minRewardAsk: form?.minRewardAsk,
        maxRewardAsk: form?.maxRewardAsk,
        token: form?.token,
        rewards: form?.rewards,
        maxBonusSpots: form?.maxBonusSpots,
      },
    });

  const compensationType = watch('compensationType');
  const rewardAmount = watch('rewardAmount');
  const minRewardAsk = watch('minRewardAsk');
  const maxRewardAsk = watch('maxRewardAsk');
  const token = watch('token');
  const rewards = watch('rewards');
  const maxBonusSpots = watch('maxBonusSpots');

  useEffect(() => {
    if (form && maxBonusSpots !== undefined) {
      if (maxBonusSpots > MAX_BONUS_SPOTS)
        setWarningMessage(t('listingPayments.maxBonusPrizesWarning'));
      if (maxBonusSpots === 0) {
        setWarningMessage(t('listingPayments.bonusPrizesZeroWarning'));
      }
    }
  }, [maxBonusSpots, form]);

  useEffect(() => {
    if (form && rewards && rewards[BONUS_REWARD_POSITION] !== undefined) {
      if (rewards[BONUS_REWARD_POSITION] === 0) {
        setWarningMessage(t('listingPayments.bonusPerPrizeZeroWarning'));
      } else if (rewards[BONUS_REWARD_POSITION] < 0.01) {
        setWarningMessage(t('listingPayments.bonusPerPrizeLowWarning'));
      }
    }
  }, [rewards]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (warningMessage) {
      timer = setTimeout(() => {
        setWarningMessage('');
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [warningMessage]);

  const [searchTerm, setSearchTerm] = useState<string | undefined>(
    tokenList.find((t) => t.tokenSymbol === token)?.tokenName,
  );
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(
    null,
  );

  const [debouncedRewardAmount, setDebouncedRewardAmount] =
    useState(rewardAmount);

  const generatePrizeList = (
    rewards: Rewards | undefined,
  ): PrizeListInterface[] => {
    if (!rewards) {
      return [
        {
          value: 1,
          label: `${getRankLabels(1)} prize`,
          placeHolder: MAX_PODIUMS * 500,
        },
      ];
    }

    const sortedRanks = sortRank(cleanRewards(rewards));

    return sortedRanks.map((r, index) => {
      let placeHolder: number;

      if (r === BONUS_REWARD_POSITION) {
        placeHolder = 100;
      } else {
        placeHolder = Math.max((MAX_PODIUMS - index) * 500, 500);
      }

      return {
        value: r,
        label:
          r === BONUS_REWARD_POSITION
            ? BONUS_REWARD_LABEL
            : `${getRankLabels(r)} prize`,
        placeHolder,
        defaultValue: rewards[r as keyof Rewards],
      };
    });
  };

  function deleteKeyRewards(rewards: Rewards, indexToDelete: string): Rewards {
    return produce(rewards, (draft) => {
      const entries = Object.entries(draft)
        .filter(([key]) => key !== BONUS_REWARD_POSITION + '')
        .sort(([a], [b]) => Number(a) - Number(b));
      const deleteIndex = entries.findIndex(([key]) => key === indexToDelete);

      if (deleteIndex !== -1) {
        entries.splice(deleteIndex, 1);
      }

      Object.keys(draft).forEach((key) => {
        if (key !== BONUS_REWARD_POSITION + '') {
          delete draft[Number(key)];
        }
      });

      entries.forEach(([, value], index) => {
        draft[`${index + 1}`] = value;
      });

      if (BONUS_REWARD_POSITION in rewards) {
        draft[BONUS_REWARD_POSITION] = rewards[BONUS_REWARD_POSITION];
      }
    });
  }

  const [prizes, setPrizes] = useState<PrizeListInterface[]>(() =>
    generatePrizeList(form?.rewards),
  );

  useEffect(() => {
    setPrizes(generatePrizeList(rewards));
  }, [rewards]);

  useEffect(() => {
    if (editable) {
      reset({
        compensationType: form?.compensationType,
        rewardAmount: form?.rewardAmount || undefined,
        minRewardAsk: form?.minRewardAsk || undefined,
        maxRewardAsk: form?.maxRewardAsk || undefined,
        rewards: form?.rewards || undefined,
        maxBonusSpots: form?.maxBonusSpots || undefined,
        token: form?.token || 'USDC',
      });

      const initialToken = form?.token || 'USDC';
      const selectedToken = tokenList.find(
        (t) => t.tokenSymbol === initialToken,
      );
      setSearchTerm(selectedToken?.tokenName);
      setSelectedToken(selectedToken);
    }
  }, [form, reset, editable]);

  const handleTokenChange = (tokenSymbol: string | undefined) => {
    setValue('token', tokenSymbol);
    const selectedToken = tokenList.find((t) => t.tokenSymbol === tokenSymbol);
    setSearchTerm(selectedToken?.tokenName);
    setSelectedToken(selectedToken);
  };

  const handlePrizeValueChange = (prizeName: number, value: number) => {
    setValue('rewards', { ...rewards, [prizeName]: value });
  };

  const handleBonusChange = (value: number | undefined) => {
    setValue('maxBonusSpots', value);
    if (
      value === undefined &&
      prizes.find((p) => p.value === BONUS_REWARD_POSITION)
    ) {
      const updatedRewards = { ...rewards };
      delete updatedRewards[BONUS_REWARD_POSITION];
      setValue('rewards', updatedRewards, { shouldValidate: true });
    }
  };

  const handlePrizeDelete = (prizeToDelete: keyof Rewards) => {
    if (prizeToDelete === BONUS_REWARD_POSITION) return;
    if (rewards) {
      const updatedRewards = deleteKeyRewards(rewards, prizeToDelete + '');
      setValue('rewards', updatedRewards, { shouldValidate: true });
    }
  };

  const isProject = type === 'project';

  const validateRewardsData = () => {
    let errorMessage = '';

    if (!selectedToken) {
      errorMessage = t('listingPayments.errorSelectToken');
    }

    if (isProject) {
      if (!compensationType) {
        errorMessage = t('listingPayments.errorCompensationType');
      }

      if (compensationType === 'fixed' && !rewardAmount) {
        errorMessage = t('listingPayments.errorFixedRewardAmount');
      } else if (compensationType === 'range') {
        if (!minRewardAsk || !maxRewardAsk) {
          errorMessage = t('listingPayments.errorRangeRewardAmount');
        } else if (maxRewardAsk < minRewardAsk) {
          errorMessage = t('listingPayments.errorInvalidRange');
        } else if (maxRewardAsk === minRewardAsk) {
          errorMessage = t('listingPayments.errorEqualRange');
        }
      }
    } else {
      if (
        rewards &&
        rewards[BONUS_REWARD_POSITION] &&
        rewards[BONUS_REWARD_POSITION] === 0
      ) {
        errorMessage = t('listingPayments.errorBonusZero');
      } else if (
        maxBonusSpots &&
        maxBonusSpots > 0 &&
        (!rewards?.[BONUS_REWARD_POSITION] ||
          isNaN(rewards?.[BONUS_REWARD_POSITION] || NaN))
      ) {
        errorMessage = t('listingPayments.errorBonusNotMentioned');
      } else if (rewards?.[BONUS_REWARD_POSITION] === 0) {
        errorMessage = t('listingPayments.errorBonusZero');
      } else if (cleanRewardPrizes(rewards).length !== prizes.length) {
        errorMessage = t('listingPayments.errorIncompleteRewards');
      }
    }

    return errorMessage;
  };

  const onDraftClick = async (isPreview: boolean = false) => {
    const data = getValues();
    const formData = { ...form, ...data };
    if (isPreview) {
      posthog.capture('preview listing_sponsor');
    } else if (isNewOrDraft || isDuplicating) {
      posthog.capture('save draft_sponsor');
    } else {
      posthog.capture('edit listing_sponsor');
    }
    createDraft(formData, isPreview);
  };

  const handleUpdateListing = async () => {
    const errorMessage = validateRewardsData();
    const data = getValues();
    let formData = { ...form, ...data };
    if (isProject) {
      if (compensationType === 'fixed') {
        formData = { ...formData, rewards: { 1: rewardAmount ?? 0 } };
      } else {
        formData = { ...formData, rewards: { 1: 0 } };
      }
    }
    if (errorMessage) {
      setErrorMessage(errorMessage);
    } else {
      createDraft(formData);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filteredResults =
      value === ''
        ? tokenList
        : tokenList.filter((token) =>
            token.tokenName.toLowerCase().includes(value.toLowerCase()),
          );
    setSearchResults(filteredResults);
    setSelectedTokenIndex(null);
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedTokenIndex((prevIndex) =>
        prevIndex === null || prevIndex === searchResults.length - 1
          ? 0
          : prevIndex + 1,
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedTokenIndex((prevIndex) =>
        prevIndex === null || prevIndex === 0
          ? searchResults.length - 1
          : prevIndex - 1,
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedTokenIndex !== null) {
        const selectedToken = searchResults[selectedTokenIndex];
        handleTokenChange(selectedToken?.tokenSymbol);
        selectedToken && handleSelectToken(selectedToken);
      }
    }
  };

  const handleSelectToken = (token: Token) => {
    setSearchTerm(token.tokenSymbol);
    setSelectedToken(token);
    setIsOpen(false);
  };

  const onSubmit = async (data: any) => {
    const errorMessage = validateRewardsData();
    let newState = { ...data };
    if (isProject) {
      if (compensationType === 'fixed') {
        newState = { ...data, rewards: { 1: rewardAmount } };
      } else {
        newState = { ...data, rewards: { 1: 0 } };
      }
    }
    updateState(newState);
    if (errorMessage) {
      setErrorMessage(errorMessage);
    } else {
      posthog.capture('publish listing_sponsor');
      confirmOnOpen();
    }
  };

  let compensationHelperText = '';

  const { t } = useTranslation();
  switch (compensationType) {
    case 'fixed':
      compensationHelperText = t('listingPayments.fixedCompensationHelper');
      break;
    case 'range':
      compensationHelperText = t('listingPayments.rangeCompensationHelper');
      break;
    case 'variable':
      compensationHelperText = t('listingPayments.variableCompensationHelper');
      break;
  }

  const posthog = usePostHog();

  const isDraft = isNewOrDraft || isDuplicating;

  const calculateTotalPrizes = () =>
    cleanRewards(rewards, true).length + (maxBonusSpots ?? 0);

  const calculateTotalReward = () =>
    calculateTotalOfArray([
      ...cleanRewardPrizes(rewards, true),
      caculateBonus(maxBonusSpots || 0, rewards?.[BONUS_REWARD_POSITION] || 0),
    ]);

  useEffect(() => {
    if (compensationType === 'fixed' && type !== 'project')
      setValue('rewardAmount', calculateTotalReward());
  }, [rewards, maxBonusSpots, compensationType, type]);

  useEffect(() => {
    const debouncedUpdate = debounce((amount) => {
      setDebouncedRewardAmount(amount);
    }, 700);

    debouncedUpdate(rewardAmount);
    return () => {
      debouncedUpdate.cancel();
    };
  }, [rewardAmount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const input = document.getElementById('search-input');
      if (input && !input.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <Modal isOpen={confirmIsOpen} onClose={confirmOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('listingPayments.confirmPublishing')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              {form?.isPrivate
                ? t('listingPayments.privateListingDescription')
                : t('listingPayments.publicListingDescription')}
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button mr={4} onClick={confirmOnClose} variant="ghost">
              {t('common.close')}
            </Button>
            <Button
              mr={3}
              colorScheme="blue"
              disabled={isListingPublishing}
              isLoading={isListingPublishing}
              loadingText={t('listingPayments.publishing')}
              onClick={() => createAndPublishListing(confirmOnClose)}
            >
              {t('listingPayments.publish')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <VStack
        align={'start'}
        gap={2}
        w={'2xl'}
        pt={5}
        pb={10}
        color={'gray.500'}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
          {isProject && (
            <Box w="100%" mb={4}>
              <FormControl isRequired>
                <Flex>
                  <ListingFormLabel htmlFor="compensationType">
                    {t('listingPayments.compensationType')}
                  </ListingFormLabel>
                  <ListingTooltip
                    label={t('listingPayments.compensationTypeTooltip')}
                  />
                </Flex>
                <Controller
                  control={control}
                  name="compensationType"
                  render={({ field: { onChange, value, ref } }) => (
                    <Select
                      ref={ref}
                      h="2.8rem"
                      color="brand.slate.900"
                      borderColor="brand.slate.300"
                      borderRadius={'sm'}
                      onChange={(e) => {
                        onChange(e);
                        setValue('minRewardAsk', undefined);
                        setValue('maxRewardAsk', undefined);
                        setValue('rewards', undefined);
                        setValue('rewardAmount', undefined);
                      }}
                      value={value}
                    >
                      <option hidden disabled value="">
                        {t('listingPayments.selectCompensationType')}
                      </option>
                      <option value="fixed">
                        {t('listingPayments.fixedCompensation')}
                      </option>
                      <option value="range">
                        {t('listingPayments.preDecidedRange')}
                      </option>
                      <option value="variable">
                        {t('listingPayments.variableCompensation')}
                      </option>
                    </Select>
                  )}
                />
              </FormControl>
              <Text mt={1} color="green.500" fontSize={'xs'}>
                {compensationHelperText}
              </Text>
            </Box>
          )}
          <FormControl pos="relative">
            <ListingFormLabel>
              {t('listingPayments.selectToken')}
            </ListingFormLabel>
            <InputGroup alignItems={'center'} display={'flex'}>
              {token && (
                <InputLeftElement
                  alignItems={'center'}
                  justifyContent={'start'}
                  mt={1}
                  ml={4}
                >
                  <SearchIcon color="gray.300" mr={2} />
                  {selectedToken ? (
                    <Image
                      w={'1.6rem'}
                      alt={searchTerm as string}
                      rounded={'full'}
                      src={selectedToken.icon}
                    />
                  ) : (
                    <></>
                  )}
                </InputLeftElement>
              )}
              <Input
                py={6}
                pl={'4.5rem'}
                color="gray.700"
                fontSize="1rem"
                fontWeight={500}
                border={'1px solid #cbd5e1'}
                borderRadius={'sm'}
                focusBorderColor="brand.purple"
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  handleSearch('');
                }}
                onKeyDown={handleKeyDown}
                placeholder={t('listingPayments.searchToken')}
                value={searchTerm || ''}
              />
              <InputRightElement color="gray.700" fontSize="1rem">
                <ChevronDownIcon mt="9px" />
              </InputRightElement>
            </InputGroup>
            {searchResults.length > 0 && isOpen && (
              <List
                pos={'absolute'}
                zIndex={10}
                overflowX="hidden"
                w="full"
                maxH="15rem"
                pt={1}
                color="gray.600"
                bg={'white'}
                border={'1px solid #cbd5e1'}
                borderBottomRadius={'lg'}
                id="search-input"
              >
                {searchResults.map((token, index) => (
                  <ListItem
                    key={token.tokenName}
                    bg={
                      selectedTokenIndex === index ? 'gray.200' : 'transparent'
                    }
                    _hover={{ background: 'gray.100' }}
                    cursor="pointer"
                    onClick={() => {
                      handleTokenChange(token.tokenSymbol);
                      handleSelectToken(token);
                    }}
                  >
                    <HStack px={3} py={2}>
                      <Image
                        w={'1.6rem'}
                        alt={token.tokenName}
                        rounded={'full'}
                        src={token.icon}
                      />
                      <Text>{token.tokenName}</Text>
                    </HStack>
                  </ListItem>
                ))}
              </List>
            )}
          </FormControl>
          {compensationType === 'fixed' && isProject && (
            <FormControl w="full" mt={5} isRequired>
              <ListingFormLabel htmlFor="rewardAmount">
                {t('listingPayments.totalCompensation', {
                  token: tokenList.find((t) => t.tokenSymbol === token)
                    ?.tokenSymbol,
                })}
              </ListingFormLabel>

              <Flex
                pos="relative"
                pr={4}
                borderWidth={1}
                borderStyle={'solid'}
                borderColor="brand.slate.300"
                borderRadius={'sm'}
                _focusWithin={{
                  borderColor: 'brand.purple',
                }}
              >
                <NumberInput
                  w="full"
                  color="brand.slate.500"
                  border={'none'}
                  focusBorderColor="rgba(0,0,0,0)"
                  min={0}
                >
                  <NumberInputField
                    color={'brand.slate.800'}
                    border={0}
                    _focusWithin={{
                      borderWidth: 0,
                    }}
                    _placeholder={{
                      color: 'brand.slate.300',
                    }}
                    {...register('rewardAmount', {
                      required: t('common.fieldRequired'),
                      setValueAs: (value) => parseFloat(value),
                    })}
                    placeholder={(MAX_PODIUMS * 500).toString()}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper h={1} border={0}>
                      <ChevronUpIcon w={4} h={4} />
                    </NumberIncrementStepper>
                    <NumberDecrementStepper h={1} border={0}>
                      <ChevronDownIcon w={4} h={4} />
                    </NumberDecrementStepper>
                  </NumberInputStepper>
                </NumberInput>
                <SelectedToken token={selectedToken} />
              </Flex>
            </FormControl>
          )}
          {compensationType === 'range' && (
            <Flex gap="3" w="100%">
              <FormControl w="full" mt={5} isRequired>
                <ListingFormLabel htmlFor="minRewardAsk">
                  {t('listingPayments.from')}
                </ListingFormLabel>
                <Flex
                  pos="relative"
                  pr={5}
                  borderWidth={1}
                  borderStyle={'solid'}
                  borderColor="brand.slate.300"
                  borderRadius={'sm'}
                  _focusWithin={{
                    borderColor: 'brand.purple',
                  }}
                >
                  <NumberInput
                    w="full"
                    color="brand.slate.500"
                    border={'none'}
                    focusBorderColor="rgba(0,0,0,0)"
                    min={0}
                  >
                    <NumberInputField
                      color={'brand.slate.800'}
                      border={0}
                      _focusWithin={{
                        borderWidth: 0,
                      }}
                      _placeholder={{
                        color: 'brand.slate.300',
                      }}
                      placeholder={t('listingPayments.enterLowerRange')}
                      {...register('minRewardAsk', {
                        required: 'This field is required',
                        setValueAs: (value) => parseFloat(value),
                      })}
                    />
                  </NumberInput>
                  <SelectedToken token={selectedToken} />
                </Flex>
              </FormControl>
              <FormControl w="full" mt={5} isRequired>
                <ListingFormLabel htmlFor="minRewardAsk">
                  {t('listingPayments.upTo')}
                </ListingFormLabel>
                <Flex
                  pos="relative"
                  pr={5}
                  borderWidth={1}
                  borderStyle={'solid'}
                  borderColor="brand.slate.300"
                  borderRadius={'sm'}
                  _focusWithin={{
                    borderColor: 'brand.purple',
                  }}
                >
                  <NumberInput
                    w="full"
                    color="brand.slate.500"
                    border={'none'}
                    focusBorderColor="rgba(0,0,0,0)"
                    min={0}
                  >
                    <NumberInputField
                      color={'brand.slate.800'}
                      border={0}
                      _focusWithin={{
                        borderWidth: 0,
                      }}
                      _placeholder={{
                        color: 'brand.slate.300',
                      }}
                      placeholder={t('listingPayments.enterHigherRange')}
                      {...register('maxRewardAsk', {
                        required: 'This field is required',
                        setValueAs: (value) => parseFloat(value),
                      })}
                    />
                  </NumberInput>
                  <SelectedToken token={selectedToken} />
                </Flex>
              </FormControl>
            </Flex>
          )}
          {type !== 'project' && (
            <VStack gap={4} w={'full'} mt={5}>
              <HStack
                justifyContent="space-between"
                w="full"
                pb={3}
                borderColor="brand.slate.200"
                borderBottomWidth="1px"
              >
                <Text>
                  {t('listingPayments.totalPrizes', {
                    count: calculateTotalPrizes(),
                  })}
                </Text>
                <Text>
                  {t('listingPayments.totalReward', {
                    amount: formatTotalPrice(calculateTotalReward()),
                    token: selectedToken?.tokenSymbol,
                  })}
                </Text>
              </HStack>
              {prizes.map((el) => (
                <FormControl key={el.value}>
                  <Flex w="full">
                    <FormLabel color={'gray.500'} textTransform="capitalize">
                      {el.label}
                    </FormLabel>
                    {el.value === BONUS_REWARD_POSITION && (
                      <FormLabel
                        pl={8}
                        color={'gray.500'}
                        textTransform="capitalize"
                      >
                        {BONUS_REWARD_LABEL_2}
                      </FormLabel>
                    )}
                  </Flex>
                  <Flex
                    pos="relative"
                    pr={4}
                    borderWidth={1}
                    borderStyle={'solid'}
                    borderColor="brand.slate.300"
                    borderRadius={'sm'}
                    _focusWithin={{
                      borderColor: 'brand.purple',
                    }}
                  >
                    {el.value === BONUS_REWARD_POSITION && (
                      <NumberInput
                        w={'30%'}
                        color="brand.slate.500"
                        border={'none'}
                        borderColor="brand.slate.300"
                        borderRightWidth={'1px'}
                        borderRightStyle={'solid'}
                        defaultValue={maxBonusSpots ?? 1}
                        focusBorderColor="rgba(0,0,0,0)"
                        max={MAX_BONUS_SPOTS}
                        min={1}
                        onChange={(valueString) =>
                          handleBonusChange(parseInt(valueString))
                        }
                      >
                        <NumberInputField
                          color={'brand.slate.800'}
                          border={0}
                          _focusWithin={{
                            borderWidth: 0,
                          }}
                          _placeholder={{
                            color: 'brand.slate.300',
                          }}
                          placeholder={JSON.stringify(el.placeHolder)}
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper h={1} border={0}>
                            <ChevronUpIcon w={4} h={4} />
                          </NumberIncrementStepper>
                          <NumberDecrementStepper h={1} border={0}>
                            <ChevronDownIcon w={4} h={4} />
                          </NumberDecrementStepper>
                        </NumberInputStepper>
                      </NumberInput>
                    )}
                    <NumberInput
                      w={el.value === BONUS_REWARD_POSITION ? '70%' : '100%'}
                      color="brand.slate.500"
                      border={'none'}
                      focusBorderColor="rgba(0,0,0,0)"
                      min={el.value === BONUS_REWARD_POSITION ? 0.01 : 0}
                      onChange={(valueString) =>
                        handlePrizeValueChange(
                          el.value,
                          parseFloat(valueString),
                        )
                      }
                      value={
                        el.defaultValue !== null &&
                        el.defaultValue !== undefined &&
                        !isNaN(el.defaultValue)
                          ? el.defaultValue
                          : undefined
                      }
                    >
                      <NumberInputField
                        color={'brand.slate.800'}
                        border={0}
                        _focusWithin={{
                          borderWidth: 0,
                        }}
                        _placeholder={{
                          color: 'brand.slate.300',
                        }}
                        placeholder={JSON.stringify(el.placeHolder)}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper h={1} border={0}>
                          <ChevronUpIcon w={4} h={4} />
                        </NumberIncrementStepper>
                        <NumberDecrementStepper h={1} border={0}>
                          <ChevronDownIcon w={4} h={4} />
                        </NumberDecrementStepper>
                      </NumberInputStepper>
                    </NumberInput>

                    <SelectedToken token={selectedToken} />
                    {el.value > 1 && (
                      <Button
                        pos="absolute"
                        right={-12}
                        px={0}
                        onClick={() => {
                          if (el.value === BONUS_REWARD_POSITION) {
                            handleBonusChange(undefined);
                          } else {
                            handlePrizeDelete(el.value as keyof Rewards);
                          }
                        }}
                        variant="ghost"
                      >
                        <DeleteIcon />
                      </Button>
                    )}
                  </Flex>
                  {!!warningMessage && el.value === BONUS_REWARD_POSITION && (
                    <Text pt={2} color="yellow.500" fontSize="sm">
                      {warningMessage}
                    </Text>
                  )}
                  {el.value === BONUS_REWARD_POSITION &&
                    !!rewards?.[BONUS_REWARD_POSITION] &&
                    rewards?.[BONUS_REWARD_POSITION] > 0 &&
                    !!maxBonusSpots &&
                    maxBonusSpots > 0 && (
                      <FormHelperText
                        display={'flex'}
                        w="full"
                        pt={2}
                        color="brand.slate.500"
                      >
                        <Text pr={1} fontWeight={700}>
                          {maxBonusSpots} individuals
                        </Text>{' '}
                        will be paid
                        <Text px={1} fontWeight={700}>
                          {' '}
                          {formatTotalPrice(
                            rewards?.[BONUS_REWARD_POSITION]!,
                          )}{' '}
                          {selectedToken?.tokenSymbol}{' '}
                        </Text>
                        each (total bonus of{' '}
                        <Text pl={1} fontWeight={700}>
                          {formatTotalPrice(
                            caculateBonus(
                              maxBonusSpots,
                              rewards?.[BONUS_REWARD_POSITION],
                            ),
                          )}{' '}
                          {selectedToken?.tokenSymbol}
                        </Text>
                        )
                      </FormHelperText>
                    )}
                </FormControl>
              ))}
            </VStack>
          )}
          <VStack
            gap={4}
            w={'full'}
            mt={10}
            pt={4}
            borderColor="brand.slate.200"
            borderTopWidth="1px"
          >
            <Text color="yellow.500">
              {!!debouncedRewardAmount &&
                debouncedRewardAmount <= 100 &&
                (token === 'USDT' || token === 'USDC') &&
                t('listingPayments.lowValueListingWarning')}
            </Text>
            {type !== 'project' && (
              <HStack w="full">
                <Button
                  w="full"
                  py={6}
                  color="brand.slate.700"
                  fontWeight={500}
                  borderColor="brand.slate.700"
                  borderRadius="sm"
                  isDisabled={
                    prizes.filter((p) => p.value !== BONUS_REWARD_POSITION)
                      .length === MAX_PODIUMS && true
                  }
                  leftIcon={<AddIcon />}
                  onClick={() => {
                    const filteredPrize = prizes.filter(
                      (p) => p.value !== BONUS_REWARD_POSITION,
                    );
                    handlePrizeValueChange(filteredPrize.length + 1 || 1, NaN);
                  }}
                  variant="outline"
                >
                  {t('listingPayments.addIndividualPrize')}
                </Button>
                {!prizes.find((p) => p.value === BONUS_REWARD_POSITION) && (
                  <Button
                    w="full"
                    py={6}
                    color="brand.slate.500"
                    fontWeight={500}
                    bg="brand.slate.100"
                    borderRadius="sm"
                    isDisabled={
                      prizes.find((p) => p.value === BONUS_REWARD_POSITION) &&
                      true
                    }
                    leftIcon={<AddIcon />}
                    onClick={() => {
                      handleBonusChange(1);
                      handlePrizeValueChange(BONUS_REWARD_POSITION, NaN);
                    }}
                  >
                    {t('listingPayments.addBonusPrize')}
                  </Button>
                )}
              </HStack>
            )}
            {isDraft && (
              <Button
                className="ph-no-capture"
                w="100%"
                py={6}
                fontWeight={500}
                borderRadius="sm"
                disabled={isListingPublishing}
                isLoading={isListingPublishing}
                type="submit"
                variant={'solid'}
              >
                {t('listingPayments.publishNow')}
              </Button>
            )}
            {isDraft && (
              <HStack w="full">
                <Button
                  className="ph-no-capture"
                  w="100%"
                  py={6}
                  color="brand.purple"
                  fontWeight={500}
                  bg="#EEF2FF"
                  borderRadius="sm"
                  isLoading={isDraftLoading}
                  onClick={() => onDraftClick()}
                  variant={'ghost'}
                >
                  {t('listingPayments.saveDraft')}
                </Button>
                <Button
                  className="ph-no-capture"
                  w="100%"
                  py={6}
                  color="brand.slate.500"
                  fontWeight={500}
                  borderRadius="sm"
                  isLoading={isDraftLoading}
                  leftIcon={<LuEye />}
                  onClick={() => onDraftClick(true)}
                  variant={'outline'}
                >
                  {t('listingPayments.preview')}
                </Button>
              </HStack>
            )}
            {!isDraft && (
              <Button
                className="ph-no-capture"
                w="100%"
                py={6}
                fontWeight={500}
                borderRadius="sm"
                isLoading={isDraftLoading}
                onClick={() => {
                  posthog.capture('edit listing_sponsor');
                  handleUpdateListing();
                }}
                variant={'solid'}
              >
                {t('listingPayments.updateListing')}
              </Button>
            )}
            {errorMessage && <Text color="red.500">{errorMessage}</Text>}
          </VStack>
        </form>
      </VStack>
    </>
  );
};

function SelectedToken({ token }: { token: Token | undefined }) {
  return (
    token && (
      <>
        <HStack p={2} borderColor="brand.slate.300" borderLeftWidth="1px">
          <Image
            w={'1.6rem'}
            alt={token.tokenName as string}
            rounded={'full'}
            src={token?.icon}
          />
          <Text>{token?.tokenSymbol}</Text>
        </HStack>
      </>
    )
  );
}
