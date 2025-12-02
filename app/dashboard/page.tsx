'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import type { VendorTab } from './types'

// Hooks
import { useVendorData } from './hooks/useVendorData'
import { useListingFilters, useOrderFilters, useInventoryFilters } from './hooks/useVendorFilters'
import { useWithdrawalActions, useBulkActions } from './hooks/useVendorActions'

// Tab Components
import ListingsTab from './components/tabs/ListingsTab'
import OrdersTab from './components/tabs/OrdersTab'
import PurchasesTab from './components/tabs/PurchasesTab'
import BalanceTab from './components/tabs/BalanceTab'
import InventoryTab from './components/tabs/InventoryTab'
import GuideTab from './components/tabs/GuideTab'

// Modal Components
import BulkActionsModal from './components/modals/BulkActionsModal'
import WithdrawalModal from './components/modals/WithdrawalModal'
import ConfirmationModal from './components/modals/ConfirmationModal'
import NotificationModal from './components/modals/NotificationModal'

// Common Components
import SpaceBackground from './components/common/SpaceBackground'
import WelcomeSection from './components/common/WelcomeSection'
import StatsOverview from './components/common/StatsOverview'
import QuickActions from './components/common/QuickActions'
import VendorRankCard from './components/common/VendorRankCard'

export default function VendorDashboardPage() {
  const [activeTab, setActiveTab] = useState<VendorTab>('listings')

  // Data hook
  const {
    user,
    profile,
    loading,
    error,
    myListings,
    myOrders,
    myPurchases,
    withdrawals,
    inventoryStats,
    activeListings,
    completedOrders,
    totalCommission,
    totalEarnings,
    totalWithdrawn,
    netRevenue,
    pendingOrders,
    pendingEarnings,
    uniqueGames,
    uniqueOrderGames,
    fetchMyListings,
    fetchWithdrawals,
    supabase,
    // Rank data
    rankData,
    rankProgress
  } = useVendorData()

  // Listing filters hook
  const listingFilters = useListingFilters(myListings)

  // Order filters hook
  const orderFilters = useOrderFilters(myOrders)

  // Inventory filters hook
  const inventoryFiltersHook = useInventoryFilters(myListings, myOrders, inventoryStats)

  // Withdrawal actions hook
  const withdrawalActions = useWithdrawalActions(
    user,
    netRevenue,
    fetchWithdrawals,
    supabase
  )

  // Bulk actions hook
  const bulkActions = useBulkActions(
    user,
    myListings,
    listingFilters.displayedListings,
    listingFilters.filteredListings,
    fetchMyListings,
    supabase
  )

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <SpaceBackground />
        <div className="relative z-10 text-center px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <SpaceBackground />
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading dashboard...</p>
          <p className="text-gray-500 mt-2 text-sm">This should only take a moment</p>
        </div>
      </div>
    )
  }

  if (profile?.role !== 'vendor') {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <SpaceBackground />
        <div className="relative z-10 text-center px-4">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You need to be a vendor to access this page.</p>
          <Link href="/customer-dashboard" className="text-purple-400 hover:text-purple-300 transition">
            Go to Customer Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <SpaceBackground />

      {/* Bulk Actions Modal */}
      {bulkActions.showBulkActions && (
        <BulkActionsModal
          selectedCount={bulkActions.selectedListings.size}
          bulkActionType={bulkActions.bulkActionType}
          setBulkActionType={bulkActions.setBulkActionType}
          bulkStatusChange={bulkActions.bulkStatusChange}
          setBulkStatusChange={bulkActions.setBulkStatusChange}
          bulkCategoryChange={bulkActions.bulkCategoryChange}
          setBulkCategoryChange={bulkActions.setBulkCategoryChange}
          bulkPriceAdjustment={bulkActions.bulkPriceAdjustment}
          setBulkPriceAdjustment={bulkActions.setBulkPriceAdjustment}
          bulkPricePercentage={bulkActions.bulkPricePercentage}
          setBulkPricePercentage={bulkActions.setBulkPricePercentage}
          bulkProcessing={bulkActions.bulkProcessing}
          handleBulkAction={bulkActions.handleBulkAction}
          onClose={bulkActions.resetBulkActions}
        />
      )}

      {/* Withdrawal Form Modal */}
      {withdrawalActions.showWithdrawalForm && (
        <WithdrawalModal
          netRevenue={netRevenue}
          withdrawalMethod={withdrawalActions.withdrawalMethod}
          setWithdrawalMethod={withdrawalActions.setWithdrawalMethod}
          withdrawalAmount={withdrawalActions.withdrawalAmount}
          setWithdrawalAmount={withdrawalActions.setWithdrawalAmount}
          withdrawalAddress={withdrawalActions.withdrawalAddress}
          setWithdrawalAddress={withdrawalActions.setWithdrawalAddress}
          withdrawalProcessing={withdrawalActions.withdrawalProcessing}
          calculateWithdrawalFees={withdrawalActions.calculateWithdrawalFees}
          handleWithdrawalSubmit={withdrawalActions.handleWithdrawalSubmit}
          onClose={withdrawalActions.resetWithdrawalForm}
        />
      )}

      {/* Withdrawal Confirmation Modal */}
      <ConfirmationModal
        isOpen={withdrawalActions.confirmModal.isOpen}
        onClose={withdrawalActions.closeConfirmModal}
        onConfirm={withdrawalActions.processWithdrawal}
        title="Confirm Withdrawal"
        message="Please review the details below before proceeding."
        confirmText="Confirm Withdrawal"
        cancelText="Cancel"
        isProcessing={withdrawalActions.withdrawalProcessing}
        sections={[
          {
            title: '📋 Withdrawal Details',
            items: [
              { label: 'Amount', value: `$${withdrawalActions.confirmModal.amount.toFixed(2)}` },
              { label: 'Method', value: withdrawalActions.confirmModal.method === 'bitcoin' ? '₿ Bitcoin' : '💳 Skrill' },
              { 
                label: withdrawalActions.confirmModal.method === 'bitcoin' ? 'Wallet Address' : 'Skrill Email', 
                value: withdrawalActions.confirmModal.address.length > 20 
                  ? `${withdrawalActions.confirmModal.address.slice(0, 10)}...${withdrawalActions.confirmModal.address.slice(-8)}`
                  : withdrawalActions.confirmModal.address
              }
            ]
          },
          {
            title: '💰 Fee Breakdown',
            items: [
              { 
                label: `${withdrawalActions.confirmModal.method === 'bitcoin' ? '6%' : '5%'} fee`, 
                value: `-$${withdrawalActions.confirmModal.fees.percentageFee.toFixed(2)}`,
                type: 'fee' as const
              },
              { 
                label: 'Flat fee', 
                value: `-$${withdrawalActions.confirmModal.fees.flatFee.toFixed(2)}`,
                type: 'fee' as const
              },
              { 
                label: 'Total fees', 
                value: `-$${withdrawalActions.confirmModal.fees.totalFee.toFixed(2)}`,
                type: 'total' as const
              },
              { 
                label: 'You will receive', 
                value: `$${withdrawalActions.confirmModal.fees.netAmount.toFixed(2)}`,
                type: 'highlight' as const
              }
            ]
          }
        ]}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={withdrawalActions.notificationModal.isOpen}
        onClose={withdrawalActions.closeNotification}
        type={withdrawalActions.notificationModal.type}
        title={withdrawalActions.notificationModal.title}
        message={withdrawalActions.notificationModal.message}
        details={withdrawalActions.notificationModal.referenceNumber ? [
          { 
            label: 'Reference Number', 
            value: withdrawalActions.notificationModal.referenceNumber, 
            copyable: true 
          }
        ] : undefined}
      />

      <div className="relative z-10">
        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <div className="container mx-auto px-4 pt-20 sm:pt-24 lg:pt-28 pb-4 sm:pb-6 lg:pb-8">
          {/* Welcome Section */}
          <WelcomeSection profile={profile} />

          {/* Stats Overview */}
          <StatsOverview
            netRevenue={netRevenue}
            totalCommission={totalCommission}
            activeListings={activeListings}
            pendingOrders={pendingOrders}
            pendingEarnings={pendingEarnings}
            completedOrders={completedOrders}
          />

          {/* Quick Actions */}
          <QuickActions />

          {/* Main Content Tabs */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-purple-500/30 transition-all duration-300">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8 border-b border-white/10 pb-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('listings')}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap ${activeTab === 'listings'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                📦 <span className="hidden sm:inline">My </span>Listings ({myListings.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap ${activeTab === 'orders'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                🛒 <span className="hidden sm:inline">My </span>Orders ({myOrders.length})
              </button>
              {/* NEW: My Purchases Tab */}
              <button
                onClick={() => setActiveTab('purchases')}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap ${activeTab === 'purchases'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                🛍️ <span className="hidden sm:inline">My </span>Purchases ({myPurchases.length})
              </button>
              <button
                onClick={() => setActiveTab('balance')}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap ${activeTab === 'balance'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                💰 <span className="hidden sm:inline">Balance</span><span className="sm:hidden">$</span>
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap ${activeTab === 'inventory'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                📊 Inventory
              </button>
              {/* Seller Rank Tab */}
              <button
                onClick={() => setActiveTab('rank')}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap ${activeTab === 'rank'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                🏆 <span className="hidden sm:inline">Seller </span>Rank
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap ${activeTab === 'guide'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                📚 <span className="hidden sm:inline">Seller </span>Guide
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'listings' && (
              <ListingsTab
                myListings={myListings}
                filteredListings={listingFilters.filteredListings}
                displayedListings={listingFilters.displayedListings}
                uniqueGames={uniqueGames}
                searchQuery={listingFilters.searchQuery}
                setSearchQuery={listingFilters.setSearchQuery}
                filterGame={listingFilters.filterGame}
                setFilterGame={listingFilters.setFilterGame}
                filterCategory={listingFilters.filterCategory}
                setFilterCategory={listingFilters.setFilterCategory}
                filterStatus={listingFilters.filterStatus}
                setFilterStatus={listingFilters.setFilterStatus}
                filterDeliveryType={listingFilters.filterDeliveryType}
                setFilterDeliveryType={listingFilters.setFilterDeliveryType}
                filterPriceMin={listingFilters.filterPriceMin}
                setFilterPriceMin={listingFilters.setFilterPriceMin}
                filterPriceMax={listingFilters.filterPriceMax}
                setFilterPriceMax={listingFilters.setFilterPriceMax}
                filterDateRange={listingFilters.filterDateRange}
                setFilterDateRange={listingFilters.setFilterDateRange}
                sortBy={listingFilters.sortBy}
                setSortBy={listingFilters.setSortBy}
                showFilters={listingFilters.showFilters}
                setShowFilters={listingFilters.setShowFilters}
                activeFilterCount={listingFilters.activeFilterCount}
                clearFilters={listingFilters.clearFilters}
                hasMoreListings={listingFilters.hasMoreListings}
                isLoadingMoreListings={listingFilters.isLoadingMoreListings}
                listingsObserverTarget={listingFilters.listingsObserverTarget}
                loadMoreListings={listingFilters.loadMoreListings}
                selectionMode={bulkActions.selectionMode}
                setSelectionMode={bulkActions.setSelectionMode}
                selectedListings={bulkActions.selectedListings}
                toggleSelectListing={bulkActions.toggleSelectListing}
                selectAllDisplayedListings={bulkActions.selectAllDisplayedListings}
                selectAllFilteredListings={bulkActions.selectAllFilteredListings}
                deselectAll={bulkActions.deselectAll}
                exitSelectionMode={bulkActions.exitSelectionMode}
                setShowBulkActions={bulkActions.setShowBulkActions}
                activeTab={activeTab}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersTab
                myOrders={myOrders}
                filteredOrders={orderFilters.filteredOrders}
                displayedOrders={orderFilters.displayedOrders}
                uniqueOrderGames={uniqueOrderGames}
                orderSearchQuery={orderFilters.orderSearchQuery}
                setOrderSearchQuery={orderFilters.setOrderSearchQuery}
                orderFilterStatus={orderFilters.orderFilterStatus}
                setOrderFilterStatus={orderFilters.setOrderFilterStatus}
                orderFilterGame={orderFilters.orderFilterGame}
                setOrderFilterGame={orderFilters.setOrderFilterGame}
                orderFilterDeliveryType={orderFilters.orderFilterDeliveryType}
                setOrderFilterDeliveryType={orderFilters.setOrderFilterDeliveryType}
                orderFilterPriceMin={orderFilters.orderFilterPriceMin}
                setOrderFilterPriceMin={orderFilters.setOrderFilterPriceMin}
                orderFilterPriceMax={orderFilters.orderFilterPriceMax}
                setOrderFilterPriceMax={orderFilters.setOrderFilterPriceMax}
                orderFilterDateFrom={orderFilters.orderFilterDateFrom}
                setOrderFilterDateFrom={orderFilters.setOrderFilterDateFrom}
                orderFilterDateTo={orderFilters.orderFilterDateTo}
                setOrderFilterDateTo={orderFilters.setOrderFilterDateTo}
                orderSortBy={orderFilters.orderSortBy}
                setOrderSortBy={orderFilters.setOrderSortBy}
                showOrderFilters={orderFilters.showOrderFilters}
                setShowOrderFilters={orderFilters.setShowOrderFilters}
                activeOrderFilterCount={orderFilters.activeOrderFilterCount}
                clearOrderFilters={orderFilters.clearOrderFilters}
                exportOrdersToCSV={orderFilters.exportOrdersToCSV}
                hasMoreOrders={orderFilters.hasMoreOrders}
                isLoadingMoreOrders={orderFilters.isLoadingMoreOrders}
                ordersObserverTarget={orderFilters.ordersObserverTarget}
                loadMoreOrders={orderFilters.loadMoreOrders}
                activeTab={activeTab}
              />
            )}

            {/* NEW: Purchases Tab Content */}
            {activeTab === 'purchases' && (
              <PurchasesTab
                myPurchases={myPurchases}
                activeTab={activeTab}
              />
            )}

            {activeTab === 'balance' && (
              <BalanceTab
                totalEarnings={totalEarnings}
                totalWithdrawn={totalWithdrawn}
                netRevenue={netRevenue}
                completedOrders={completedOrders}
                withdrawals={withdrawals}
                setShowWithdrawalForm={withdrawalActions.setShowWithdrawalForm}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryTab
                myListings={myListings}
                myOrders={myOrders}
                inventoryStats={inventoryStats}
                inventoryFilter={inventoryFiltersHook.inventoryFilter}
                setInventoryFilter={inventoryFiltersHook.setInventoryFilter}
                inventorySort={inventoryFiltersHook.inventorySort}
                setInventorySort={inventoryFiltersHook.setInventorySort}
                getFilteredInventory={inventoryFiltersHook.getFilteredInventory}
              />
            )}

            {/* Rank Tab Content */}
            {activeTab === 'rank' && (
              <VendorRankCard
                currentRank={rankData.currentRank}
                completedOrders={rankProgress.completedOrders}
                averageRating={rankProgress.averageRating}
                disputeRate={rankProgress.disputeRate}
                accountAgeDays={rankProgress.accountAgeDays}
                commissionRate={rankData.commissionRate}
                totalReviews={rankProgress.totalReviews}
              />
            )}

            {activeTab === 'guide' && (
              <GuideTab />
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}