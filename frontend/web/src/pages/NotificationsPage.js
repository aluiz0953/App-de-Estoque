import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Title, Paragraph, List, Button, Avatar, Icon } from 'react-native-paper';
import { getNotifications, markNotificationAsRead, deleteNotification } from '../store/slices/inventorySlice';
import { useFetchNotifications } from '../hooks/useFetchNotifications';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read

  const { data: notifications, isLoading, error } = useFetchNotifications({ filter: filter === 'unread' ? { lida: false } : {} });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    if (window.confirm('Tem certeza que deseja excluir esta notificação?')) {
      try {
        await dispatch(deleteNotification(notificationId)).unwrap();
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const filteredNotifications = notifications?.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.lida;
    if (filter === 'read') return notification.lida;
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Button mode="text" onPress={() => navigate(-1)}>
              <Icon name="arrow-left" size={24} color="#5B2C6F" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
            <div className="flex items-center space-x-3">
              <Button
                mode="text"
                onPress={handleRefresh}
                disabled={isLoading || refreshing}
              >
                {isLoading || refreshing ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 bg-${filter === 'all' ? 'indigo-600' : 'gray-200'} text-${filter === 'all' ? 'white' : 'gray-700'} rounded-md hover:bg-${filter === 'all' ? 'indigo-700' : 'gray-300'} transition`}
            >
              Todas ({notifications?.length || 0})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 bg-${filter === 'unread' ? 'indigo-600' : 'gray-200'} text-${filter === 'unread' ? 'white' : 'gray-700'} rounded-md hover:bg-${filter === 'unread' ? 'indigo-700' : 'gray-300'} transition`}
            >
              Não Lidas ({filteredNotifications.filter(n => !n.lida).length || 0})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 bg-${filter === 'read' ? 'indigo-600' : 'gray-200'} text-${filter === 'read' ? 'white' : 'gray-700'} rounded-md hover:bg-${filter === 'read' ? 'indigo-700' : 'gray-300'} transition`}
            >
              Lidas ({filteredNotifications.filter(n => n.lida).length || 0})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex min-h-[80vh] flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Carregando notificações...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Erro ao carregar notificações: {error.message}</p>
            <Button mode="text" onPress={handleRefresh}>
              Tentar Novamente
            </Button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma notificação encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className={`p-4 border rounded-lg shadow-md ${
                !notification.lida ? 'border-l-4 border-indigo-500 bg-indigo-50' : ''
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <Avatar.Icon size={40} icon="bell" color="#5B2C6F" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">{notification.titulo}</h3>
                      <p className="text-sm text-gray-600 mb-2">{notification.mensagem}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          <Icon name="calendar" size={16} color="#5B2C6F" />
                          {new Date(notification.dataCriacao).toLocaleString('pt-BR')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          notification.lida ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.lida ? 'Lida' : 'Não lida'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          notification.tipo === 'estoque_critico' ? 'bg-red-100 text-red-800' :
                          notification.tipo === 'vencimento' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.tipo === 'estoque_critico' ? 'Estoque Crítico' :
                           notification.tipo === 'vencimento' ? 'Vencimento Próximo' : 'Outro'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end space-x-2">
                    <Button
                      mode="text"
                      onPress={() => handleMarkAsRead(notification.id)}
                      disabled={notification.lida}
                    >
                      {notification.lida ? 'Lida' : 'Marcar como lida'}
                    </Button>
                    <Button
                      mode="text"
                      onPress={() => handleDelete(notification.id)}
                      color="#E74C3C"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;