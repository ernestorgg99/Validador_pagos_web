from flask import Blueprint, jsonify, request
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from db import get_session
from models import PagoValidado, PagoMovil

reports_bp = Blueprint('reports', __name__)

@reports_bp.route("/dashboard-stats", methods=["GET"])
def dashboard_stats():
    session = get_session()
    try:
        # Rango de fecha por defecto: últimos 30 días
        days = request.args.get('days', 30, type=int)
        fecha_limite = datetime.now() - timedelta(days=days)

        # 1. Tendencia Diaria (Últimos X días)
        # Agrupamos por fecha de validación (casting a Date si es necesario, pero PagoValidado.fecha_validacion es DateTime)
        # Nota: SQLite usa func.date(), Postgres usa cast. Asumimos compatibilidad básica.
        daily_query = session.query(
            func.date(PagoValidado.fecha_validacion).label('fecha'),
            func.sum(PagoValidado.monto).label('total_monto'),
            func.count(PagoValidado.id).label('cantidad')
        ).filter(
            PagoValidado.fecha_validacion >= fecha_limite
        ).group_by(
            func.date(PagoValidado.fecha_validacion)
        ).order_by(
            func.date(PagoValidado.fecha_validacion)
        ).all()

        daily_trend = [{
            "fecha": str(row.fecha),
            "total_monto": float(row.total_monto or 0),
            "cantidad": row.cantidad
        } for row in daily_query]

        # 2. Distribución por Banco (Total Histórico o del rango)
        # Usaremos el rango para que sea consistente con la gráfica
        bank_query = session.query(
            PagoValidado.banco_origen,
            func.count(PagoValidado.id).label('cantidad'),
            func.sum(PagoValidado.monto).label('total_monto')
        ).filter(
            PagoValidado.fecha_validacion >= fecha_limite
        ).group_by(
            PagoValidado.banco_origen
        ).order_by(
            desc('cantidad')
        ).all()

        bank_distribution = [{
            "banco": row.banco_origen,
            "cantidad": row.cantidad,
            "total_monto": float(row.total_monto or 0)
        } for row in bank_query]

        # 3. Desempeño de Operadores (Top 5 del rango)
        operator_query = session.query(
            PagoValidado.usuario_nombre,
            func.count(PagoValidado.id).label('cantidad')
        ).filter(
            PagoValidado.fecha_validacion >= fecha_limite
        ).group_by(
            PagoValidado.usuario_nombre
        ).order_by(
            desc('cantidad')
        ).limit(5).all()

        operator_performance = [{
            "usuario": row.usuario_nombre,
            "cantidad": row.cantidad
        } for row in operator_query]
        
        # 4. KPI Totales del Día
        hoy = datetime.now().date()
        kpi_query = session.query(
            func.sum(PagoValidado.monto).label('total_hoy'),
            func.count(PagoValidado.id).label('cantidad_hoy')
        ).filter(
            func.date(PagoValidado.fecha_validacion) == hoy
        ).first()

        kpi_stats = {
            "total_hoy": float(kpi_query.total_hoy or 0),
            "cantidad_hoy": kpi_query.cantidad_hoy
        }

        return jsonify({
            "daily_trend": daily_trend,
            "bank_distribution": bank_distribution,
            "operator_performance": operator_performance,
            "kpi": kpi_stats
        })

    except Exception as e:
        print(f"Error generando reporte: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@reports_bp.route("/conciliacion", methods=["GET"])
def conciliacion_diaria():
    session = get_session()
    try:
        fecha_str = request.args.get('fecha') # YYYY-MM-DD
        if not fecha_str:
            fecha_str = datetime.now().strftime('%Y-%m-%d')
        
        # Agrupar por Banco para el día específico
        query = session.query(
            PagoValidado.banco_origen,
            func.count(PagoValidado.id).label('transacciones'),
            func.sum(PagoValidado.monto).label('total_monto')
        ).filter(
            func.date(PagoValidado.fecha_validacion) == fecha_str
        ).group_by(
            PagoValidado.banco_origen
        ).all()

        resultado = [{
            "banco": row.banco_origen,
            "transacciones": row.transacciones,
            "total_monto": float(row.total_monto or 0)
        } for row in query]

        return jsonify({
            "fecha": fecha_str,
            "conciliacion": resultado
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
